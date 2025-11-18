const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'get.js' }); // scoped logger
const bcrypt = require('bcrypt');
const { ERROR_CODES } = require('@sharedErr');

// naming can be changed 
// get each element from database , such as score, name , status
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password
// this should be what is being returned
/**
 * 		const mockProfile = {
				username: "PlayerOne",
				avatarFile: "avatars/avatar1.png",
				twoFactor: false,
				rank: 5,
				score: 1200,
				victories: 15,
				losses: 7,
				totalMatches: 22,
				friends: [
					{ id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
					{ id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
				],
				matchHistory: [
					{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
					{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
				],
			};
this could be managed by routes calling 3 fucntions     const player = await db.getPlayerById(playerId);
    const friends = await db.getFriendsForPlayer(playerId);
    const matchHistory = await db.getMatchHistory(playerId);
 */

async function fetchUser(userId ) {
	//console.log('Finside db::fetching user with ID:', userId);
	//const test = userId.id;
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					console.warn('User not found for ID:', userId);
					reject({ error: 'User not found fecth' });
				} else {
					//console.log('User found:', row);
					resolve(row);
				}

			});
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
// get friends list for userId, take information from users table , as usenames may change
// rename provided results to make data access clearer
// status is pending, accepted, blocked etc. attatched which can be used in front end if wished
async function getFriendsForPlayer( userId ) {
	flog.info({ function: 'getFriendsForPlayer', username: userId}, 'checking id matches  ');
	//const test = userId.id;
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT users.id AS user_id,
				users.username AS username,
				users.avatar_file AS avatar,
				users.status AS online_status,
				friends.status AS friendshipstatus
			FROM friends
			JOIN users ON friends.friend_id = users.id
			WHERE friends.user_id = ?`,
			[userId],
			(err, rows) => {
				if (err) {
					if (!rows) {	
						rows = [];
						resolve(rows);
					}
					console.error('DB error fetching friends:', err);
					reject({ error: 'DB error fetching friends' });
				} else {
					const formattedRows = rows.map(row => ({
						...row, // keep all original fields
						status: Boolean(row.status) // convert just this one
					}));
					console.log(`Found ${rows.length} friends for user ID ${userId}`);
					resolve(formattedRows);
				}
			}
		);
	});
}
// can we have a schema that checks if table empty first?
async function getMatchHistory(userId) {
	//console			.log('DB::Fetching match history for user ID:', userId);
//	const test = userId.id;
	return new Promise((resolve, reject) => {
		db.all(
			` 	SELECT 
				    match_history.user_id AS matchID,
				    match_history.result AS result,
				    match_history.user_score AS score,
				    match_history.match_date AS timestamp,
					users.username AS opponentUsername,
					users.id AS userTableID,
					match_history.opponent_id AS opid,
				    CASE 
				        WHEN match_history.opponent_type = 'login' THEN users.username
				        WHEN match_history.opponent_type = 'guest' THEN 'Guest'
				        WHEN match_history.opponent_type = 'ai' THEN 'AI Bot'
				    END AS opponent
				FROM match_history
				LEFT JOIN users ON match_history.opponent_id = users.id
				WHERE match_history.user_id = ?;
			`
			,[userId],
			(err, rows) => {
				if (err) {
					console.error('DB error fetching match history:', err);
					if (!rows) {	
						rows = [];
						resolve(rows);
					}	
					reject({ error: 'DB error fetching match history' });
				} else {
					//console.log(`Found ${rows.length} matches for user ID ${userId}`);
					//console.log("whats going on with username -- ${rows.opponentUsername}");
					//console.log("and the users.id is ${rows.userTableId}");
					//console.log("and as opid ${rows.opid}")
					resolve(rows || []);
				}
			}
		);
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

async function checkPasswordMatch( userId, password ) {
	console.log('Fetching user with password:', );
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) =>{
			    if (err) {
        			return reject({ error: 'Database error', code: 418 });
      			}
    			if (!row) {
        			return reject({ error: 'User not found', code: 404 });
      			}
		    	bcrypt.compare(password, row.password, (err, isMatch) => {
        			if (err) {
        				return reject({ error: 'Hash comparison failed', code: 418 });
        			}
        			if (!isMatch) {
          				return reject({ error: 'Invalid password', code: 400 });
        			}
					if (isMatch){
		        		resolve({ ok: 'Password match', userId: row.id });
					}
				});
			}
		)
			
		});
}
// mini example of checking player exists and password matches . 

async function miniLogin(username, password) {
  console.log("minilogin activated, no access to profile should be possible");

  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
		if (err) {
		  return reject({ error: 'Database error', code: 401 });
		}
		if (!row) {
		  return reject({ error: 'User not found', code: 401 });
		}
		  // Compare hashed password
		bcrypt.compare(password, row.password, (err, isMatch) => {
			if (err) {
			  return reject({ error: 'Hash comparison failed', code: 418 });
			}
			if (!isMatch) {
			  return reject({ error: 'Invalid password', code: 400 });
			}
			if (isMatch) {
				flog.info({ function: 'miniLogin', userId: row.id}, 'mini login success ');
				resolve({ id: row.id});
			}
//      // TEMP: plain text password check for testing only
//      if (row.password !== password) {
//        return reject({ error: 'Invalid password', code: 401 });
      })
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
//similar logic as below may be required
//async function userRoutes(fastify, options) {
//  await registerUser(fastify, options);
//  await getUser(fastify, options);
//}
//
//module.exports = userRoutes;
