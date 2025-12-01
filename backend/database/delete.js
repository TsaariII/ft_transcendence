const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger

'use strict';

function deleteUserById(userId)
{
  return new Promise((resolve, reject) => {
    if (!userId || typeof userId !== 'string')
      return reject(new Error('Invalid user ID'));
    db.run(
      `DELETE FROM users WHERE id = ?`, [userId],
      function (err) {
        if (err)
          return reject(err);
        resolve(this.changes);  
      }
    );
  });
}

function deleteUserByUsername(username)
{
  return new Promise((resolve, reject) => {
    if (!username || typeof username !== 'string')
      return reject(new Error('Invalid username'));
    db.run(
      `DELETE FROM users WHERE username = ?`, [username],
      function (err) {
        if (err)
          return reject(err);
        resolve(this.changes);
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
        OF (user_id = ? AND friend_id = ?)`,
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