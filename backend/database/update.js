const db = require('./initDB');
const {logger} = require('@logger');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const flog = logger.child({fileContext: 'DB/update.js'});

function updateOnlineStatus(userId, status)
{
	// const normalizedStatus = typeof status === 'string' ? status : status ? 'online' : 'offline ';
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET status = ? WHERE id = ?`, [status, userId],
			function (err) {
				if (err)
					return reject({error: 'Failed to update status', code: 418, details: err});
				if (this.changes === 0)
					return reject({error: 'No changes made', code: 401});
				return resolve({updated: this.changes, status: status});
			}
		);
	});
}

function updateUserScore({userId, score})
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`, [score, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update score', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Score updated',
					userId,
					newScore: score
				});
			}
		);
	});
}

function updateUsername(username, userId)
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET username = ? WHERE id = ?`, [username, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update username', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Username updated',
					userId,
					newUsername: score
				});
			}
		)
	})
}

function updatePassword(password, userId)
{
	return new Promise((resolve, reject) => {
		bcrypt.hash(password, saltRounds, (hashErr, hash) => {
			if (hashErr)
				return ({error: 'Failed to hash password', details: err});
		});
		db.run(
			`UPDATE users SET password = ? WHERE id = ?`, [hash, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update password', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Username updated',
					userId
				});
			}
		);
	});
}

function changeAvatar(avatar, userId)
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET avatar = ? WHERE id = ?`, [avatar, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update avatar', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Score updated',
					userId,
					avatar: avatar
				});
			}
		);
	});
}

function changeLanguage(language, userId)
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET language = ? WHERE id = ?`, [language, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update language', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Score updated',
					userId,
					newLanguage: language
				});
			}
		);
	});
}

function update2fa(enabled, userId, secret)
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET mfa_enabled = ?, mfa_secret = ? WHERE id = ?`,
			[enabled ? 1 : 0, secret || null, userId],
			function (err) {
				if (err)
					return ({error: 'Failed to update 2fa', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Score updated',
					userId,
					enabled
				});
			}
		);
	});
}

function recomputeLeaderboardRanks()
{
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT id score FROM users ORDER BY score DESC, id ASC`, [],
			(err, rows) => {
				if (err)
					return reject({error: 'Failed to fetch users for rank recompute', details: err});
				db.serialize(() => {
					const stmt = db.prepare(`UPDATE users SET rank = ? WHERE id = ?`);
					let rank = 1;
					rows.forEach((row) => {
						stmt.run(rank, row.id);
						rank += 1;
					});
					stmt.finalize((finalizeErr) => {
						if (finalizeErr)
							return reject({error: 'Failed to update ranks', details: err});
						resolve({
							message: 'ranks computed',
							totalUsers: rows.length
						});
					});
				});
			}
		);
	});
}

function updatePlayerGameStats(winner, id)
{
	const scoreDelta = winner ? 10 : 5;
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run(
				`UPDATE users SET wins = wins + ?, losses = losses + 1, score = score + ?, total_games = total_games + 1 WHERE id = ?`,
				[winner ? 1 : 0, winner ? 0 : 1, scoreDelta, id],
				function (err) {
					if (err)
						return reject({error: 'Failed to update player stats', details: err});
					if (this.changes === 0)
						return reject({error: 'User not found, no changes made'});
					recomputeLeaderboardRanks().then(() => {
						db.get(
							`SELECT wins, losses, score, total_games, rank FROM users WHERE id = ?`, [id],
							(getErr, row) => {
								if (getErr)
									return reject({error: 'Failed to fetch updated stats', details: err});
								if (this.changes === 0)
									return reject({error: 'User not found after stats update'});
								const payload = {
									message: 'player game stats updated',
									userId: id,
									wins: row.wins,
									losses: row.losses,
									score: row.score,
									total_games: row.total_games,
									rank: row.rank
								};
								return resolve(payload);
							}
						);
					}).catch((rankErr) => { return reject(rankErr); });
				}
			);
		});
	});
}

module.exports = {
	updateOnlineStatus,
	updateUserScore,
	updatePassword,
	updateUsername,
	changeAvatar,
	changeLanguage,
	update2fa,
	updatePlayerGameStats
}