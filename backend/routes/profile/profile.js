const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const { saveAndGetAvatarUrl, deleteOldAvatar } = require('./save_avatar.js'); // <-- Note the new import
const flog = logger.child({ fileContext: 'profile.js' }); // scoped logger

const {
  getActiveTournamentForUser,
  buildTournamentState
} = require('../../database/tournament'); // fix path to your DAL

async function getUser(fastify, options) {
  const { DBget, secure, db } = options; // <-- make sure you pass `db` when you register this plugin

  const toFriend = (r) => ({
    user_id: r.friendID,
    username: r.username,
    avatar: r.avatar || undefined,
    online_status: r.status === 'online'
  });

  // Match history item -> your frontend Match shape (for the history list)
  const toMatch = (g) => {
    const status = (g.status === 'finished') ? 'finished'
                : (g.status === 'ongoing')  ? 'ongoing'
                : 'pending';
    return {
      match_id: String(g.id),
      player1: {
        username: g.p1_username || '',
        alias: g.p1_alias || g.p1_username || '',
        status: status === 'ongoing' ? 'playing' : (status === 'finished' ? 'finished' : 'ready'),
        avatar: undefined,
        score: g.p1_score ?? undefined,
        isSelf: undefined,
        isVerified: undefined,
        role: 'player1'
      },
      player2: {
        username: g.p2_username || '',
        alias: g.p2_alias || g.p2_username || '',
        status: status === 'ongoing' ? 'playing' : (status === 'finished' ? 'finished' : 'ready'),
        avatar: undefined,
        score: g.p2_score ?? undefined,
        isSelf: undefined,
        isVerified: undefined,
        role: 'player2'
      },
      winner: g.winner_username || undefined,
      score: { player1: g.p1_score ?? 0, player2: g.p2_score ?? 0 },
      status
    };
  };

  fastify.get(API_PROTOCOL.GET_PROFILE.path, {}, async (request, reply) => {
    const token = request.cookies?.auth_token;
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });

    let userId;
    try {
      userId = secure.getUserIdFromToken(token);
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      // 1) base user row
      const profile = await DBget.fetchUser({ userId });

      // 2) friends + match history
      const [friendsRows, historyRows] = await Promise.all([
        DBget.getFriendsForPlayer(userId),
        DBget.getMatchHistory({ userId })
      ]);

      // 3) tournament state (use the DAL; do NOT rely on a non-existent users.active_tournament_id)
      const active = await getActiveTournamentForUser(db, userId);
      const tournament = active
        ? await buildTournamentState(db, active.id, userId)
        : null;

      // 4) final payload (keep keys your UI uses)
      const payload = {
        user_id: userId,
        username: profile.username,
        avatarFile: profile.avatar_file || undefined,
        twoFactor: !!profile.mfa_enabled,
        rank: profile.rank ?? 0,
        score: profile.score ?? 0,
        victories: profile.wins ?? 0,
        losses: profile.losses ?? 0,
        totalMatches: profile.total_games ?? 0,
        tournamentWins: undefined, // not in schema
        friends: friendsRows.map(toFriend),
        matchHistory: historyRows.map(toMatch),

        // Give the frontend exactly what it expects:
        // either a full TournamentState or null (so it knows to show "Create/Join")
        tournament: tournament,

        language: profile.language || 'en'
      };

      return reply.code(200).send(payload);
    } catch (err) {
      request.log.error({ err }, 'Failed to build profile');
      return reply.code(500).send({ error: 'Failed to fetch profile' });
    }
  });
}

async function updateUsername(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_USERNAME.method,
		url: API_PROTOCOL.CHANGE_USERNAME.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.ChangeUsername }, dosnt exist yet 
		const { username } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBget.checkUsernameAvailable(username);
				console.log('checking check', check)
				if (check.taken) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'username not available'
					})
				}	
				const res = await DBupdate.updateUsername(username, userId.id);
				console.log('checking res', res);
			}

			const profile = await DBget.fetchUser({userId});
			if (!profile) {
				console.log('error in fetching user id or profile ');
				reply.code(404).send({
					status: 'ERROR',
					error: 'no such user'
				})
			}

			reply.code(200).send({
				status: 'UPDATED',
				profile: profile,
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updatePassword(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_PASSWORD.method,
		url: API_PROTOCOL.CHANGE_PASSWORD.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.ChangeUsername }, dosnt exist yet 
		const { current_password, new_password } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBget.checkPasswordMatch(current_password);
				console.log('checking check', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'current password does not match'
					})
				}
				//update password after checks valid
				const res = await DBupdate.updatePassword(new_password, userId.id);
				console.log('checking res', res);
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	}
	});
}

// Route for file upload (POST) 
async function uploadAvatarFileRoute(fastify, options) {
	const { DBupdate, DBget, secure } = options; 
	fastify.route({
		method: API_PROTOCOL.UPLOAD_AVATAR.method, // POST
		url: API_PROTOCOL.UPLOAD_AVATAR.path,     // /api/profile/avatar
		
		handler: async (request, reply) => {
			flog.info({ function: 'uploadAvatarFileRoute' }, 'Attempting avatar file upload');
			
			let newAvatarUrl = null; // Initialize to track the newly saved file
			
			try {
				const token = request.cookies.auth_token;
				const userId = secure.getUserIdFromToken(token);

				if (!userId) {
					reply.code(401).send({ status: 'ERROR', error: 'Unauthorized' });
					return;
				}

				// 1. Fetch current user data to get the old avatar URL for later deletion
				const currentUserData = await DBget.fetchUser({ userId });
				const oldAvatarUrl = currentUserData ? currentUserData.avatar_file : null;

				// Parse the file data from the multipart request
				const data = await request.file();
				if (!data || data.fieldname !== 'file') {
					reply.code(400).send({ status: 'ERROR', error: 'No file received or wrong field name' });
					return;
				}
				
				// Validate file type (basic check)
				const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
				if (!allowedMimes.includes(data.mimetype)) {
					// Optionally log this attempt
					reply.code(400).send({ status: 'ERROR', error: 'Invalid file type. Only JPEG, PNG, and GIF allowed.' });
					return;
}

				// 2. Save the new file and get its public URL
				newAvatarUrl = await saveAndGetAvatarUrl(data, userId.id);

				// 3. Update the user's database entry with the new URL
				const updateCheck = await DBupdate.changeAvatar(newAvatarUrl, userId.id);

				if (updateCheck.error) {
					flog.error({ error: updateCheck.error }, 'Failed to update database with new avatar URL. Attempting file rollback.');
					
					// Delete the newly uploaded file if DB update fails
					await deleteOldAvatar(newAvatarUrl); 
					
					reply.code(500).send({ status: 'ERROR', error: 'Database update failed' });
					return;
				}

				// 4. Delete the old file from disk (only if DB update succeeded)
				await deleteOldAvatar(oldAvatarUrl);
				
				// Success response, returning the URL the frontend needs
				reply.code(200).send({
					status: 'UPLOADED',
					url: newAvatarUrl, // The public URL the frontend will use
				});

			} catch (err) {
				// If a file was saved but an error occurred outside of the DB check (e.g., file saving failed)
				// we should attempt to clean up if newAvatarUrl was set.
				if (newAvatarUrl) {
					await deleteOldAvatar(newAvatarUrl); // Clean up temp file
				}
				flog.error({ err }, 'Error during avatar file upload (includes file system errors)');
				reply.code(500).send({ status: 'ERROR', error: 'Server error during upload' });
			}
		},
	});
}


async function updateAvatar(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_AVATAR.method,
		url: API_PROTOCOL.CHANGE_AVATAR.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateAvatar }, dosnt exist yet 
		const { avatar } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBupdate.changeAvatar(avatar, userId.id);
				console.log('checking check', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid avatar?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during avatar change:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updateLanguage(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_LANGUAGE.method,
		url: API_PROTOCOL.CHANGE_LANGUAGE.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateLanguage }, dosnt exist yet 
		const { language } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBupdate.changeLanguage(language, userId.id);
				console.log('checking check Language', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid Language?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during Language change:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updateTwoFactor(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_2FA.method,
		url: API_PROTOCOL.CHANGE_2FA.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateTwoFactor }, dosnt exist yet 
		const { twoFactor } = request.body;
		flog.debug({ function: 'updateTwoFactor', body: request.body }, 'Toggling Two Factor Authentication , inc body');
		try {
			
			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);	
			if (userId){
				const check = await DBupdate.update2fa(userId.id);
				console.log('checking check Two Factor', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid Two Factor?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		}
		catch (err) {
			console.log(('Error during Two Factor change:', err));
			reply.code(500).send(err);
		}
	}
	});
}	

async function profileRoutes(fastify, options) {
	await getUser(fastify, options);
	await updateUsername(fastify, options);
	await updatePassword(fastify, options);
	await updateAvatar(fastify, options);
	await uploadAvatarFileRoute(fastify, options); // POST for file upload
	await updateLanguage(fastify, options);
	await updateTwoFactor(fastify, options);
}
module.exports = profileRoutes