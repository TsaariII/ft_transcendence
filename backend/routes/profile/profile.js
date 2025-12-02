const {API_PROTOCOL} = require('@sharedApi');
const {saveAndGetAvatarUrl, deleteOldAvatar} = require('./save_avatar.js');
const {logger} = require('@logger');
const flog = logger.child({fileContext: 'profile.js'});

const {
	getActiveTournamentForUser,
	buildTournamentState
} = require('../../database/tournament.js');

async function profileRoutes(fastify, options)
{
	const {DBget, DBupdate, db} = options;
	const toFriend = (r) => ({
		user_id: r.friendID,
		username: r.username,
		avatar: r.avatar || undefined,
		online_status: r.status === 'online'
	});
	const toMatch = (g, userId) => {
		const isP1 = String(g.p1_id) === String(userId);
		const myScore = isP1 ? g.p1_score : g.p2_score;
		const oppScore = isP1 ? g.p2_score : g.p1_score;
		let result;
		if (myScore > oppScore) result = 'win';
		else if (myScore < oppScore) result = 'loss';
		else result = 'loss';
		const opponentId = isP1 ? g.p2_id : g.p1_id;
		const opponentName = isP1 ? g.p2_name : g.p1_name;
		return {
			user_id: opponentId != null ? String(opponentId) : '',
			opponent: opponentName || String(opponentId ?? ''),
			result,
			score: `${myScore ?? 0}-${oppScore ?? 0}`,
			timestamp: g.created_at
		};
	};
	fastify.get(API_PROTOCOL.GET_PROFILE.path, async (request, reply) => {
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({error: 'Authentication required'});
		try
		{
			let freshStats = null;
			try
			{
				if (DBupdate && typeof DBupdate.resyncPlayerScoreAndRank === 'function')
					freshStats = await DBupdate.resyncPlayerScoreAndRank(userId);
			}
			catch (syncErr) {}
			const profile = await DBget.fetchUser(userId);
			if (!profile)
				return reply.code(404).send({error: 'User not found'});
			const [friendsRows, matchHistoryRows] = await Promise.all([
				DBget.getFriendsForPlayer(userId),
				DBget.getMatchHistory(userId)
			]);
			const active = await getActiveTournamentForUser(db, userId);
			const tournament = active ? await buildTournamentState(db, active.id, userId) : null;
			const statsSource = freshStats || profile;
			const payload = {
				user_id: userId,
				username: profile.username,
				avatarFile: profile.avatar_file || profile.avatar || undefined,
				twoFactor: !!profile.mfa_enabled,
				rank: statsSource.rank ?? 0,
				score: statsSource.score ?? 0,
				victories: statsSource.wins ?? 0,
				losses: statsSource.losses ?? 0,
				totalMatches: statsSource.total_games ?? 0,
				tournamentWins: undefined,
				friends: friendsRows.map(toFriend),
				matchHistory: matchHistoryRows.map((g) => toMatch(g, userId)),
				tournament,
				language: profile.language || 'en',
			};
			return reply.code(200).send(payload);
		}
		catch (err)
		{
			if (err && err.error === 'Failed to fetch match history')
				return reply.code(500).send({ error: 'Failed to fetch match history' });
			return reply.code(500).send({ error: 'Failed to fetch profile' });
		}
	});
	fastify.patch(API_PROTOCOL.CHANGE_USERNAME.path, async (request, reply) => {
		const {username} = request.body || {};
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		if (!username || typeof username !== 'string')
			return reply.code(400).send({status: 'ERROR', error: 'Invalid username'});
		try
		{
			let isTaken = false;
			try
			{
				const check = await DBget.checkUsernameAvailable(userId, username);
				isTaken = !!check.taken;
			}
			catch (checkErr)
			{
				return reply.code(500).send({status: 'ERROR', error: 'Failed to validate username'});
			}
			if (isTaken)
				return reply.code(500).send({status: 'ERROR', error: 'Username not available'});
			await DBupdate.updateUsername(username, userId);
			const profile = await DBget.fetchUser(userId);
			return reply.code(200).send({status: 'UPDATED', profile});
		}
		catch (err)
		{
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.patch(API_PROTOCOL.CHANGE_PASSWORD.path, async (request, reply) => {
		const {current_password, new_password} = request.body || {};
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		if (!current_password || !new_password)
			return reply.code(400).send({status: 'ERROR', error: 'Missing password field'});
		try
		{
			const check = await DBget.checkPasswordMatch(userId, current_password);
			if (!check && check.match !== true)
				return reply.code(400).send({status: 'ERROR', error: 'Current password does not match'});
			await DBupdate.updatePassword(new_password, userId);
			return reply.code(200).send({status: 'UPDATED'});
		}
		catch (err)
		{
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.patch(API_PROTOCOL.CHANGE_AVATAR.path, async (request, reply) => {
		const {avatar} = request.body || {};
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		if (!avatar || typeof avatar !== 'string')
			return reply.code(400).send({status: 'ERROR', error: 'Invalid avatar'});
		try
		{
			const res = await DBupdate.changeAvatar(avatar, userId);
			if (res && res.error)
				return reply.code(400).send({status: 'ERROR', error: 'Invalid avatar'});
			return reply.code(200).send({status: 'UPDATED'});
		}
		catch (errr)
		{
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.post(API_PROTOCOL.UPLOAD_AVATAR.path, async (request, reply) => {
		let newAvatarUrl = null;
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		try
		{
			const currentUserData = await DBget.fetchUser(userId);
			const OldAvatarUrl = currentUserData?.avatar_file || currentUserData?.avatar || null;
			const data = await request.file();
			if (!data || data.fieldname !== 'file')
				return reply.code(400).send({status: 'ERROR', error: 'No file received or wrong field name'});
			const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
			if (!allowedMimes.includes(data.mimetype))
				return reply.code(400).send({status: 'ERROR', error: 'Invalid file type. Allowed types JPEG, PNG and GIF'});
			newAvatarUrl = await saveAndGetAvatarUrl(data, userId);
			const updateCheck = await DBupdate.changeAvatar(newAvatarUrl, userId);
			if (updateCheck && updateCheck.error)
			{
				await deleteOldAvatar(newAvatarUrl);
				return reply.code(500).send({status: 'ERROR', error: 'Batabase update failed'});
			}
			if (OldAvatarUrl)
				await deleteOldAvatar(OldAvatarUrl);
			return reply.code(200).send({status: 'UPLOADED', url: newAvatarUrl});
		}
		catch (err)
		{
			if (newAvatarUrl)
			{
				try { await deleteOldAvatar(newAvatarUrl); }
				catch (cleanupErr) {}
			}
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.patch(API_PROTOCOL.CHANGE_LANGUAGE.path, async (request, reply) => {
		const {language} = request.body || {};
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		if (!language || typeof language !== 'string')
			return reply.code(400).send({status: 'ERROR', error: 'Invalid language'});
		try
		{
			const res = await DBupdate.changeLanguage(language, userId);
			if (res && res.error)
				return reply.code(400).send({status: 'ERROR', error: 'Not valid language'});
			return reply.code(200).send({status: 'UPDATED'});
		}
		catch (err)
		{
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.post(API_PROTOCOL.CHANGE_2FA.path, async (request, reply) => {
		const {twoFactor} = request.body || {};
		const userId = request.userId;
		if (!userId)
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		try
		{
			const enabled = !!twoFactor;
			const res = await DBupdate.update2fa(enabled, userId, null);
			if (res && res.error)
				return reply.code(400).send({status: 'ERROR', error: 'Invalid two factor request'});
			return reply.code(200).send({status: 'UPDATED'});
		}
		catch (err)
		{
			return reply.code(500).send({status: 'ERROR', error: 'Server error'});
		}
	});
	fastify.get(API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.path, async (request, reply) => {
		const {user_id} = request.query || {};
		const viewerId = request.userId;
		if (!viewerId)
			return reply.code(401).send({error: 'Authentication required'});
		if (!user_id)
			return reply.code(400).send({error: 'Missing user ID'});
		if (user_id === viewerId)
			return reply.code(400).send({error: 'Invalid target'});
		try
		{
			const profile = await DBget.fetchUser(user_id);
			if (!profile)
				return reply.code(404).send({error: 'User not found'});
			const matchHistory = await DBget.getMatchHistory(user_id);
			const tournamentWins = await new Promise((resolve, reject) => {
				db.get(
					`SELECT COUNT(*) AS wins
						FROM tournaments
					WHERE winner_id = ?`, [user_id],
					(err, row)  => {
						if (err) return reject(err);
						resolve(row?.wins ?? 0);
					} 
				);
			});
			const payload = {
				username: profile.username,
				avatarFile: profile.avatar_file || profile.avatar || undefined,
				rank: profile.rank ?? 0,
				score: profile.score ?? 0,
				victories: profile.wins ?? 0,
				losses: profile.losses ?? 0,
				totalMatches: profile.total_games ?? 0,
				tournamentWins,
				matchHistory: matchHistory.map((g) => toMatch(g, user_id))
			};
			return reply.code(200).send(payload);
		}
		catch (err)
		{
			if (err && err.error === 'User not found')
				return reply.code(404).send({error: 'User not found'});
			if (err && err.error === 'Failed to fetch match history')
				return reply.code(500).send({error: 'Failed to fetch match history'});
			return reply.code(500).send({error: 'Failed to fetch profile'});
		}
	});
}

module.exports = profileRoutes;