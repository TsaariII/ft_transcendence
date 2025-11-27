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

module.exports = {insertGame};