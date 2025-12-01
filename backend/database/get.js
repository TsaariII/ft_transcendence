const db = require('./initDB.js');
const bcrypt = require('bcrypt');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'get.js' }); // scoped logger


function _normalizeId(arg) {
  return typeof arg === 'string' ? arg : (arg && arg.id) ? arg.id : undefined;
}

function fetchUser(userId)
{
//   const id = _normalizeId(userId);
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, username, avatar_file, language, status, mfa_enabled, rank, score, wins, losses, total_games
       FROM users WHERE id = ?`,
      [userId],
      (err, row) => {
        if (err) return reject({ error: 'DB error fetchUser' });
        if (!row) return reject({ error: 'User not found' });
        resolve(row);
      }
    );
  });
}

function getFriendsForPlayer(userId) {
  const id = _normalizeId(userId);
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT u.id AS friendID,
              u.username AS username,
              u.avatar_file AS avatar,
              u.status AS status
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ? AND f.status = 'accepted'
       ORDER BY u.username COLLATE NOCASE`,
      [id],
      (err, rows) => {
        if (err) return reject({ error: 'DB error getFriendsForPlayer' });
        resolve(rows || []);
      }
    );
  });
}

function getMatchHistory(userId, limit = 10)
{
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT
        g.id,
        g.p1_id,
        g.p2_id,
        g.p1_score,
        g.p2_score,
        g.mode,
        g.created_at,
        u1.username AS p1_name,
        u2.username AS p2_name
        FROM games g
        LEFT JOIN users u1 ON g.p1_id = u1.id
        LEFT JOIN users u2 ON g.p2_id = u2.id
        WHERE (p1_id = ? AND p2_id IS NOT NULL)
           OR (p2_id = ? AND p1_id IS NOT NULL)
        ORDER BY g.created_at DESC
        LIMIT ?`, [userId, userId, limit],
        (err, rows) => {
        if (err) return reject({error: 'Failed to fetch match history', details: err});
        resolve(rows);
      });
  });
}

// function getMatchHistory(userId, limit = 10)
// {
//   return new Promise((resolve, reject) => {
//     db.all(
//       `SELECT id, p1_id, p2_id, p1_score, p2_score,
//               mode, created_at
//        FROM games
//        WHERE (p1_id = ? AND p2_id IS NOT NULL)
//           OR (p2_id = ? AND p1_id IS NOT NULL)
//        ORDER BY created_at DESC
//        LIMIT ?`, [userId, userId, limit],
//        (err, rows) => {
//         if (err) return reject({error: 'Failed to fetch match history', details: err});
//         resolve(rows);
//        }
//     )
//   })
// }

// get user by username , ie when adding friend
async function fetchUserByUsername(username)
{
  if (username === undefined) {flog.warn({ function: 'fetUserByUsername'}, 'username undefined')}
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
      if (err)
					reject({ error: 'DB error fecth' });
			if (!row)
        reject({ error: 'User not found fecth' });
			resolve(row.id);
    });
	});
}


//needs some adjustment for clarity
async function checkUsernameAvailable(username)
{
  return new Promise((resolve, reject) => {
    db.get(`SELECT password FROM users WHERE id = ?`, [userId], async (err, row) => {
      if (err)
        return reject({error: 'DB error password check'});
      if (!row)
        return reject({error: 'User not found'});
      try
      {
        const ok = await bcrypt.compare(password, row.password);
        if (!ok)
          return resolve({match: flase});
        return resolve({match: true});
      }
      catch (e) { return reject({error: 'Password check failed'}); }
    });
  });
}

// {
//   return new Promise((resolve, reject) => {
//     db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
//       if (err)
//         reject({ error: 'DB error checking username' });
// 			resolve({taken: !!row});
// 		});
// 	});
// }

async function checkPasswordMatch(password)
{
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE password = ?', [password], (err, row) => {
      if (err || !row)
        reject({ error: 'password does not match' });
			resolve({ok: 'password match'});
		});
	});
}
// mini example of checking player exists and password matches . 

async function miniLogin(username, password)
{
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) return reject({ error: 'Database error' });
      if (!row) return reject({ error: 'User not found' });
      try
      {
        const ok = await bcrypt.compare(password, row.password);
        if (!ok) return reject({error: 'Invalid username or password'});
        resolve({id: row.id});
      }
      catch (e) { reject({error: 'Password check failed'}); }
    });
  });
}

async function get2FaSecret(userId)
{
  return new Promise((resolve, reject) => {
    db.get('SELECT mfa_secret FROM users WHERE id = ?', [userId], (err, row) => {
      if (err)
        reject(new Error('DB error fetching secret: ' + err.message));
      if (!row)
        reject(new Error('User not found fetching secret'));
      resolve(row.mfa_secret);
    });
  });
}

async function is2FaEnabled(userId)
{
  return new Promise((resolve, reject) => {
    db.get('SELECT mfa_enabled FROM users WHERE id = ?', [userId], (err, row) =>{
      if (err) 
					reject({ error: 'DB error fecth' });
			if (!row)
        reject({ error: 'User not found fecth' });
			resolve(Boolean(row.mfa_enabled));
    });
  });
}

module.exports = { fetchUser, 
	miniLogin, 
	getFriendsForPlayer, 
	getMatchHistory,
	checkUsernameAvailable,
	checkPasswordMatch,
	fetchUserByUsername,
	is2FaEnabled,
	get2FaSecret
};