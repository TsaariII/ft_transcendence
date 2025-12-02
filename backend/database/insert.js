const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');
const { existsSync } = require('fs');

function insertUser({ username, password, score = 0, status = 'online', avatarFile = 'frontend/src/assets/avatars/default-avatar.png'}) {
  flog.info({function: 'insertUser'}, 'Creating user');
  return new Promise(async (resolve, reject) => {
    try
    {
      if (!username || !password)
        return reject({status: 400, error: 'Username and password are required'});
      const id = randomUUID();
      const hash = await bcrypt.hash(password, 10);
      db.run(
        `INSERT INTO users (id, username, password, avatar_file, status, score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, username, hash, avatarFile, status, score],
        function (err) {
          if (err)
          {
            const isConstraint =
            err.code === 'SQLITE_CONSTRAINT' ||
            err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            err.errno === 19 ||
            (err.message && err.message.includes('UNIQUE constraint failed'));
            if (isConstraint) return reject({status: 409, error: 'Username already taken'});
            return reject({status: 500, error: 'DB insert failed', details: err});
          }
          resolve(id);
        }
      );
    }
    catch (e) { reject({status: 500, error: 'Hashing failed', details: err}); }
  });
}

function insertFriend(friendId, userId)
{
  if (!friendId || !userId)
    return Promise.reject({error: 'Invalid friend parameters'});
  if (friendId === userId)
    return Promise.reject({error: 'Cannot add yourself as a friend'});
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT OR IGNORE INTO friends (user_id, friend_id, status)
         VALUES (?, ?, 'accepted')`, [userId, friendId],
         function (err) {
          if (err)
            return reject({error: 'Failed to add friend', details: err});
          db.run(
            `INSERT OR IGNORE INTO friends (user_id, friend_id, status)
             VALUES (?, ?, 'accepted')`, [friendId, userId],
             function (err2) {
              if (err2)
                return reject({error: 'Failed to add reverse friend', details: err2});
             }
          )
          db.all(
            `SELECT * FROM friends WHERE user_id = ?`, [userId],
            (err3, rows) => {
              return resolve({message: 'Friend added'});
            }
          );
         }
      );
    });
  });
}


module.exports = {
	insertUser,
	insertFriend,
};

