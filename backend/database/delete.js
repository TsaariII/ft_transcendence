'use strict';
const db = require('./initDB.js');
const {recomputeLeaderboardRanks} = require('./update.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger

function closeActiveTournamentForUser(userId) {
	return new Promise((resolve, reject) => {
		if (!userId || typeof userId !== 'string')
			return reject(new Error('Invalid user ID'));
		db.run(
			`UPDATE tournaments
				SET status = 'closed'
			WHERE id IN (
			SELECT t.id
			FROM tournaments t
			JOIN tournament_players tp ON tp.tournament_id = t.id
			WHERE tp.user_id = ?
				AND t.status = 'ongoing')`, [userId],
			function (err) {
				if (err)
					return reject(err);
				resolve(this.changes);
			}
		);
	});
}

function deleteUserById(userId)
{
  return new Promise((resolve, reject) => {
    if (!userId || typeof userId !== 'string')
      return reject(new Error('Invalid user ID'));
	closeActiveTournamentForUser(userId).then(() => {
		db.run(
		  `DELETE FROM users WHERE id = ?`, [userId],
		  function (err) {
			if (err)
			  return reject(err);
			recomputeLeaderboardRanks().then(() =>
				resolve(this.changes)).catch(reject);  
		  }
		);
	}).catch(reject);
  });
}

function deleteUserByUsername(username)
{
  return new Promise((resolve, reject) => {
    if (!username || typeof username !== 'string')
      return reject(new Error('Invalid username'));
    db.get(
      `SELECT id FROM users WHERE username = ?`, [username],
      async function (err, row) {
        if (err)
          return reject(err);
		if (!row)
			return resolve(0);
		try
		{
			const changes = await deleteUserById(row.id);
			resolve(changes);
		}
		catch (e) { reject(e); }
      }
    );
  });
}

function deleteFriendById(userId, friendId)
{
  return new Promise((resolve, reject) => {
    if (!userId || !friendId)
      return reject(new Error('Invalid friend parameters'));
    if (userId === friendId)
      return reject(new Error('Cannot remove yourself as a friend'));
    db.run(
      `DELETE FROM friends
        WHERE (user_id = ? AND friend_id = ?)
        OR (user_id = ? AND friend_id = ?)`,
        [userId, friendId, friendId, userId],
        function (err) {
          if (err)
            return reject(err);
          resolve(this.changes);
        }
    );
  });
}

module.exports = {
	deleteUserById,
	deleteUserByUsername,
	deleteFriendById,
};