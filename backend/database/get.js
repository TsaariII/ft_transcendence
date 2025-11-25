const db = require('./initDB.js');
const bcrypt = require('bcrypt');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'get.js' }); // scoped logger


function _normalizeId(arg) {
  return typeof arg === 'string' ? arg : (arg && arg.id) ? arg.id : undefined;
}

function fetchUser(userId) {
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

// Returns games the user participated in, with joined usernames/aliases
function getMatchHistory(userId) {
//   const id = _normalizeId(userId);
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT
          g.id,
          g.tournament_id,
          g.p1_id, g.p2_id,
          g.p1_score, g.p2_score,
          g.status,
          g.winner_id,
          u1.username AS p1_username,
          u2.username AS p2_username,
          uW.username AS winner_username,
          tp1.alias AS p1_alias,
          tp2.alias AS p2_alias,
          g.round,
          g.bracket_pos
       FROM games g
       LEFT JOIN users u1 ON u1.id = g.p1_id
       LEFT JOIN users u2 ON u2.id = g.p2_id
       LEFT JOIN users uW ON uW.id = g.winner_id
       LEFT JOIN tournament_players tp1 ON tp1.tournament_id = g.tournament_id AND tp1.user_id = g.p1_id
       LEFT JOIN tournament_players tp2 ON tp2.tournament_id = g.tournament_id AND tp2.user_id = g.p2_id
       WHERE g.p1_id = ? OR g.p2_id = ?
       ORDER BY g.id DESC`,
      [userId, userId],
      (err, rows) => {
        if (err) return reject({ error: 'DB error getMatchHistory' });
        resolve(rows || []);
      }
    );
  });
}

// get user by username , ie when adding friend
async function fetchUserByUsername(username) {
	if (username === undefined) {flog.warn({ function: 'fetUserByUsername'}, 'username undefined')}
	flog.info({ function: 'fetUserByUsername', username: username}, 'username: ');
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
				if (err) {
					flog.error({ function: 'fetUserByUsername', err}, 'DB error:');
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					flog.warn({ function: 'fetUserByUsername', username: username}, 'User not found :');
					reject({ error: 'User not found fecth' });
				} else {
					flog.info({ function: 'fetUserByUsername', row}, 'User found:');
					resolve(row.id);
				}

			});
		});
}


//needs some adjustment for clarity
async function checkUsernameAvailable( username ) {
	console.log('Fetching user with username:', username);
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
				if (err || !row) {
					resolve({ error: 'Username available' });
				} else {
					reject({error: 'Username not available'});
				}
			});
		});
}

async function checkPasswordMatch( password ) {
	console.log('Fetching user with password:', );
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE password = ?', [password], (err, row) =>{
				if (err || !row) {
					reject({ error: 'password does not match' });
				} else {
					resolve({ok: 'password match'});
				}
			});
		});
}
// mini example of checking player exists and password matches . 

async function miniLogin(username, password) {
  console.log("minilogin activated, no access to profile should be possible");
  flog.info({ function: 'miniLogin' }, 'login attempt');
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

async function get2FaSecret(userId) {
    console.log('DB::Fetching 2FA secret for user ID:', userId);
    return new Promise((resolve, reject) => {
        db.get('SELECT mfa_secret FROM users WHERE id = ?', [userId], (err, row) => {
            if (err) {
                console.error('DB error fetching secret:', err);
                reject(new Error('DB error fetching secret: ' + err.message));
            } else if (!row) {
                console.warn('User not found in DB for ID:', userId);
                reject(new Error('User not found fetching secret'));
            } else {
                console.log('2FA secret found for user ID:', userId);
                resolve(row.mfa_secret);
            }
        });
    });
}

async function is2FaEnabled(userId) {
	console.log('DB::Checking if 2FA is enabled for user ID:', userId);
		return new Promise((resolve, reject) => {
			db.get('SELECT mfa_enabled FROM users WHERE id = ?', [userId], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					console.warn('User not found for ID:', userId);
					reject({ error: 'User not found fecth' });
				} else {
					resolve(Boolean(row.mfa_enabled));
				}

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