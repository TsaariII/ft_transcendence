const db = require('./initDB');
const {logger} = require('@logger');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const WIN_POINTS = 10;
const LOSS_POINTS = 5;

const flog = logger.child({fileContext: 'DB/update.js'});

function updateOnlineStatus(userId, status)
{
	const normalizedStatus = typeof status === 'string' ? status : status ? 'online' : 'offline ';
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET status = ? WHERE id = ?`, [normalizedStatus, userId],
			function (err) {
				if (err)
					return reject({error: 'Failed to update status', code: 418, details: err});
				// if (this.changes === 0)
				// 	return reject({error: 'No changes made', code: 401});
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
					return reject({error: 'Failed to update score', details: err});
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
					return reject({error: 'Failed to update username', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Username updated',
					userId,
					newUsername: username
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
				return reject({error: 'Failed to hash password', details: hashErr});
			db.run(
				`UPDATE users SET password = ? WHERE id = ?`, [hash, userId],
				function (err) {
					if (err)
						return reject({error: 'Failed to update password', details: err});
					if (this.changes === 0)
						return reject({error: 'User not found, no changes made'});
					return resolve({
						message: 'Password updated',
						userId
					});
				}
			);
		});
	});
}

function changeAvatar(avatar, userId)
{
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET avatar_file = ? WHERE id = ?`, [avatar, userId],
			function (err) {
				if (err)
					return reject({error: 'Failed to update avatar', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Changed avatar',
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
					return reject({error: 'Failed to update language', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: 'Language changed',
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
					return reject({error: 'Failed to update 2fa', details: err});
				if (this.changes === 0)
					return reject({error: 'User not found, no changes made'});
				return resolve({
					message: '2fa updated',
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
			`SELECT id, score FROM users ORDER BY score DESC, id ASC`, [],
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
	const incWin = winner ? 1 : 0;
	const incLoss = winner ? 0 : 1;

	return new Promise((resolve, reject) => {
		db.serialize(() => {

			const doUpdate = () => {
				db.run(
					`UPDATE users
						 SET wins        = wins + ?,
						 	losses      = losses + ?,
						 	total_games = total_games + 1,
						 	score       = (wins + ?) * ? + (losses + ?) * ?
						WHERE id = ?`,
					[incWin, incLoss, incWin, WIN_POINTS, incLoss, LOSS_POINTS, id],
					function (err) {
						if (err)
							return reject({error: 'Failed to update player stats', details: err});
						if (this.changes === 0)
							return reject({error: 'User not found, no changes made'});

						recomputeLeaderboardRanks()
							.then(() => {
								db.get(
									`SELECT wins, losses, score, total_games, rank
									 FROM users
									 WHERE id = ?`,
									[id],
									(getErr, row) => {
										if (getErr)
											return reject({error: 'Failed to fetch updated stats', details: getErr});
										if (!row)
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
							})
							.catch((rankErr) => { return reject(rankErr); });
					}
				);
			};
			if (gameId) {
				db.get(
					`SELECT id FROM games WHERE id = ?`,
					[gameId],
					(err, row) => {
						if (err)
							return reject({error: 'Failed to verify game before stats update', details: err});

						if (!row)
						{
							return resolve({
								message: 'Game no longer exists, stats not updated',
								userId: id,
								skipped: true
							});
						}
						doUpdate();
					}
				);
			}
			else
				doUpdate();
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