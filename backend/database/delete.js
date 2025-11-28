const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger

'use strict';
// dont include db as a prameter, we include it as a require, if you must include it
// as a parameter , ({db, id}) must be passed as a part of an object
/**
 * Delete a user by numeric id.
 * Returns the number of rows deleted (0 or 1).
 * Requires PRAGMA foreign_keys=ON (your init already does this).
 */
function deleteUserById(id) {
  return new Promise((resolve, reject) => {
    // defensive: ensure integer
	console.log('checking id', id);
	const userId = id;
	// const userId = Number(id);
	console.log('db function delete check id', userId, 'type', typeof userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return reject(new Error('Invalid user id'));
    }

    db.run(
      'DELETE FROM users WHERE id = ?',
      [userId],
      function onDone(err) {
        if (err) return reject(err);
        // this.changes is provided by sqlite3 and tells how many rows were affected
        resolve(this.changes);
      }
    );
  });
}

function deleteFriendById(userId, friendId)
{
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM friends
      WHERE (user_id = ? AND friend_id ?)
        OR (user_id = ? AND friend_id = ?)`, [userId, friendId, friendId, userId],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes);
        }
    );
  });
}

// function deleteFriendById(userId, friendId) {
//   return new Promise((resolve, reject) => {
// 	flog.debug({fucntion: 'deleteFreindById', user: userId, friend: friendId}, 'checking id');
//     db.run(
//       'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
//       [userId,friendId],
//       function onDone(err) {
//         if (err) return reject(err);
//         // this.changes is provided by sqlite3 and tells how many rows were affected
//         resolve(this.changes);
//       }
//     );
//   });
// }


/**
 * Optional convenience: delete by username (unique). may be not needed
 */
function deleteUserByUsername(username) {
  return new Promise((resolve, reject) => {
    if (!username || typeof username !== 'string') {
      return reject(new Error('Invalid username'));
    }
	db, serialize (() => {
    db.run(
      'DELETE FROM users WHERE username = ?',
      [username],
      function onDone(err) {
        if (err) return reject(err);
        	return resolve(this.changes);
      },
	  db.run('DELETE FROM tournament_players WHERE user_id = ?',
			[player.user_id], function(err) {
				if (err) {
					flog.error({fucntion: 'DBremovePlayer'});
					return reject({error: 'DB error in rmeove player'});
				}
				else if (this.changes === 0) {
					return reject({error: 'DB remove player no changes made '});
				}
				return resolve(this.changes);
			}

		)
    );
  })
  });
}

module.exports = {
	deleteUserById,
	deleteUserByUsername,
	deleteFriendById,
};