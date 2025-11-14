const db = require('./initDB');
// const updateScoreSchema = require('@schemas/updateScore.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DB/update.js' }); // scoped logger
const bcrypt = require('bcrypt');
const saltRounds = 10;

function updateOnlineStatus(userId, status) {
	flog.info({function: "updateOnlineStatus"})
	return new Promise((resolve, reject) => {
		db.run ('UPDATE users SET status = ? WHERE id = ?',
			[status, userId],
			function (err) {
				if (err)
					return reject ({ error: 'failed to update status', code: 418 });
				else if (this.changes === 0)
					return reject({error: 'no changes made', code: 401});
				return resolve (this.changes);
			}
		)
	}
)
}

function updateUserScore({userId, score}) {
	console.log('updating score for user:', { userId, score });

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`,
			[score, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the score', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'Score updated', userId: userId, newScore: score});
				}
			}
		);
	});
}

function updateUsername(username, userId) {
	console.log('updating username for user:', { username, userId});

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET username = ? WHERE id = ?`,
			[username, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the username', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'username updated', userId: userId, newUsername: username});
				}
			}
		);
	});
}

function updatePassword(hashedPassword, userId) {
	console.log('updating username for user:', { hashedPassword, userId});

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET password = ? WHERE id = ?`,
			[hashedPassword, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the password', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'password updated', userId: userId, newPassword: hashedPassword});
				}
			}
		);
	});
}

function changeAvatar(avatar, userId) {
	console.log('updating avatar for user:', userId);

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET  avatar_file = ? WHERE id = ?`,
			[avatar, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the avatar', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'password updated', userId: userId, newAvatar: avatar});
				}
			}
		);
	});
}

function changeLanguage(language, userId) {
	console.log('updating language for user:', userId);

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET  language = ? WHERE id = ?`,
			[language, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the language', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'language updated', userId: userId, newLanguage: language});
				}
			}
		);
	});
}

async function update2fa(enabled, userId, secret) {
	flog.debug({ function: 'update2fa', userId: userId, enabled: enabled }, 'Updating 2FA settings for user');

	return new Promise((resolve, reject) => {
		db.run(
			'UPDATE users SET mfa_enabled = ?, mfa_secret = ? WHERE id = ?',
			[enabled ? 1 : 0, secret || null, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update 2fa', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: '2fa updated', userId: userId, enabled: enabled});
				}
			}
		);
	});
	
}
/**
 * 
 * @param {*} winner bool if winner or not 
 * @param {*} id player id
 * @param {*} score score to update
 */
async function updatePlayerGameStats(winner, id, score) {
	flog.debug({ function: 'updateGameStats', userId: id, winner: winner, score: score }, 'Updating game stats for user');

	return new Promise((resolve, reject) => {
		db.serialize(() => {
			db.run(
				'UPDATE users SET  wins = wins + ?, losses = losses + ?, score = score + ?, total_games = total_games + 1 WHERE id = ?',
				[winner ? 1 : 0, winner ? 0 : 1, score, id],
				function (err) {
					if (err) {
						flog.error({ function: 'updateGameStats', error: err }, 'Error updating player game stats');
						return reject({ error: 'Failed to update player game stats ', details: err});
					} else if (this.changes === 0) {
						flog.error({ function: 'updateGameStats' }, 'No changes made, user not found');
						reject({ error: 'User not found , no changes made' });
					} else {
	        db.get(
	            'SELECT wins, losses, score, total_games FROM users WHERE id = ?',
	            [id],
	            (err, row) => {
	              if (err) {
	                reject({ error: 'Failed to fetch updated stats', details: err });
	              } else {
						const { wins, total_games, score } = row;
						const winRate = total_games > 0 ? wins / total_games : 0;
						const experienceFactor = total_games / (total_games + 10);
						const rank = Math.round(score * winRate * experienceFactor);
						db.run(
							'UPDATE users SET rank = ? WHERE id = ?',
							[rank, id],
							(err) => {
								if (err) {
									flog.error({ function: 'updateGameStats', error: err }, 'Error updating rank');
									reject({ error: 'Failed to update rank', details: err });
								}
							})
					flog.debug({function: "updategamestats", ...row}, "show me the stats");
	                resolve({ message: 'player game stats updated', userId: id, ...row });
	              }
	            }
	          );
	        }
		})
      }
    );
  });
}

//helper
//	function calculateRank(score, wins, totalGames) {
//  const winRate = totalGames > 0 ? wins / totalGames : 0;
//  const experienceFactor = totalGames / (totalGames + 10); // dampens low-game players
//  return score * winRate * experienceFactor;
//}



async function applyTournamentId(userId, tournamentId){
	return new Promise ((resolve, reject) =>{
		db.run(
			'UPDATE users SET active_tournament_id = ? WHERE id = ?',
			[tournamentId, userId],
			function (err) {
				if (err) {
					flog.error({ function: 'applyTournamentId', error: err }, 'Error updating player game stats');
					reject({ error: 'Failed to update player game stats ', details: err});
				} else if (this.changes === 0) {
					flog.error({ function: 'applyTournamentId' }, 'No changes made, user not found');
					reject({ error: 'User not found , no changes made' });
				} else {
					return resolve({ messgae: 'active touramnet set', tid: tournamentId})
				}
			}
		)
	})
}
//
async function updateMatchHistory(userId, result, userScore, userType, opponentId, opponentScore, opponentType) {
  return new Promise((resolve, reject) => {
	// must first make sure thet type has valid id, user1 will always be logged in
	if (userType !== 'login') {
    	return resolve({ message: `No match history needed for ${userType}` });
	}
	console.log("what is the id before all the shifty buisness", opponentId);
	const numericOpponentId = opponentType === 'login' ? opponentId : null;
	console.log("checking update match history that opponent id makes sense", numericOpponentId);
	db.serialize(() => {
      // Check how many matches the user has we rae capped at 10 at this moment
      db.get(
        'SELECT COUNT(*) AS count FROM match_history WHERE user_id = ?',
        [userId],
        (err, row) => {
        	if (err) return reject({ error: 'Failed to count match history', details: err });
			// Create a call back delete function in here as we wont use it anywhere else
          const maybeDeleteOldest = (cb) => {
            if (row.count >= 10) {
              db.run(
                'DELETE FROM match_history WHERE id = (SELECT id FROM match_history WHERE user_id = ? ORDER BY match_date ASC LIMIT 1)',
                [userId],
                cb
              );
            } else {
              cb();
            }
          };

          maybeDeleteOldest(() => {
            //  Insert new match after if delete
            db.run(
              `INSERT INTO match_history 
              (user_id, opponent_id, user_score, opponent_score, result, opponent_type, match_date) 
              VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [userId, numericOpponentId, userScore, opponentScore, result, opponentType],
              function (err) {
                if (err) {
                  reject({ error: 'Failed to insert match history', details: err });
                } else {
                  resolve({ 
                    matchId: this.lastID,
                    userId,
                    opponentId,
                    result,
                    score: userScore,
                    opponentScore,
                    //timestamp: new Date().toISOString()
					//this.chnages later
                  });
                }
              }
            );
          });
        }
      );
    });
  });
}

//async function updateMatchHistory(userId, result, score, opponentId) {
//	flog.debug({ function: 'updateMatchHistory', userId: userId }, 'Updating match history for user');
//
//	return new Promise((resolve, reject) => {
//		db.get('FROM users WHERE id = ?',
//		[]	
//		)
//		db.run(
//			'INSERT INTO match_history = ? WHERE id = ?',
//			[, userId],
//			function (err) {
//				if (err) {
//					reject({ error: 'Failed to update match history', details: err});
//				} else if (this.changes === 0) {
//					reject({ error: 'User not found , no changes made' });
//				} else {
//					resolve({ message: 'match history updated', userId: userId});
//				}
//			}
//		);
//	});
//}	
//	
module.exports = { updateUserScore,
	updateUsername,
	updatePassword,
	changeAvatar,
	changeLanguage,
	update2fa,
	updatePlayerGameStats,
	applyTournamentId,
	updateMatchHistory,
	updateOnlineStatus
};