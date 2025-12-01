'use strict'

const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({fileContext: 'DBgame.js'});

function insertGame({
    tournamentId = null,
    p1_id = null,
    p2_id = null,
    type = null,
    mode = null,
    round = null,
    bracket_pos = null,
    status = 'pending'
} = {}) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO games (tournament_id, p1_id, p2_id, type, mode, round, bracket_pos, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tournamentId, p1_id, p2_id, type, mode, round, bracket_pos, status],
            function (err) {
                if (err)
                {
                    flog.error({function: 'InsertGame', errMsg: err.message},
                    'Failed to insert game row');
                    return reject(err);
                }
                resolve({id: this.lastID});
            }
        );
    });
}

function updateGameResult(gameId, {
    p1_id = null,
    p2_id = null,
    p1_score = 0,
    p2_score = 0,
    winner_id = null,
    status = 'finished'
    } = {}
)
{
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE games
            SET p1_id = ?,
                p2_id = ?,
                p1_score = ?,
                p2_score = ?,
                winner_id = ?,
                status = ?
            WHERE id = ?`,
            [p1_id, p2_id, p1_score, p2_score, winner_id, status, gameId],
            function (err) {
                if (err)
                    return reject({error: 'Failed to update game result', details: err});
                if (this.changes === 0)
                    return reject({error: 'Game not found', code: 404});
                return resolve({message: 'Game result updated', gameId});
            }
        );
    });
}

module.exports = {insertGame, updateGameResult};