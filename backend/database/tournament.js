'use strict';

const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DBtournament.js' }); // scoped logger
const tournament = require('../routes/tournament/tournament.js');
const bcrypt = require('bcrypt');
const ROLE_COL = 'role'; // matches your schema

function _wrap(db) {
  return {
    run: (sql, params=[]) => new Promise((res, rej) =>
      db.run(sql, params, function (err){ if (err) rej(err); else res({lastID: this.lastID, changes: this.changes}); })
    ),
    get: (sql, params=[]) => new Promise((res, rej) =>
      db.get(sql, params, (e, row) => e ? rej(e) : res(row || null))
    ),
    all: (sql, params=[]) => new Promise((res, rej) =>
      db.all(sql, params, (e, rows) => e ? rej(e) : res(rows || []))
    ),
    tx: async (fn) => {
      const run = (s,p = []) => _wrap(db).run(s,p);
      await run('BEGIN');
      try { const r = await fn(_wrap(db)); await run('COMMIT'); return r; }
      catch (e) { await run('ROLLBACK'); throw e; }
    },
  };
}

async function getActiveTournamentForUser(db, userId) {
  const { get } = _wrap(db);
  return get(
    `SELECT t.id, t.status
     FROM tournaments t
     JOIN tournament_players tp ON tp.tournament_id = t.id
     WHERE tp.user_id = ?
       AND t.status IN ('waiting','ongoing')
     ORDER BY t.id DESC LIMIT 1`, [userId]
  );
}

async function getTournamentById(db, tid) {
  const { get } = _wrap(db);
  return get(`SELECT id, status, winner_id FROM tournaments WHERE id = ?`, [tid]);
}

async function getTournamentPlayers(db, tid) {
  const { all } = _wrap(db);
  return all(
    `SELECT tp.user_id, tp.alias, tp.${ROLE_COL} AS role, tp.status, tp.verified,
            u.username, u.avatar_file AS avatar
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     WHERE tp.tournament_id = ?
     ORDER BY tp.${ROLE_COL} ASC`, [tid]
  );
}

async function getGamesForTournament(db, tid) {
  const { all } = _wrap(db);
  return all(
    `SELECT id AS game_id, p1_id, p2_id, p1_score, p2_score, winner_id,
            round, bracket_pos, status
     FROM games
     WHERE tournament_id = ?
     ORDER BY round ASC, bracket_pos ASC`, [tid]
  );
}

async function setTournamentStatus(db, tid, status) {
  const { run } = _wrap(db);
  return run(`UPDATE tournaments SET status = ? WHERE id = ?`, [status, tid]);
}

async function isRoleTaken(db, tid, role) {
  const { get } = _wrap(db);
  return !!(await get(
    `SELECT 1 FROM tournament_players WHERE tournament_id = ? AND ${ROLE_COL} = ?`,
    [tid, role]
  ));
}

async function upsertHostAlias(db, tid, alias) {
  const { run } = _wrap(db);
  return run(
    `UPDATE tournament_players SET alias = ?, status = 'ready'
     WHERE tournament_id = ? AND ${ROLE_COL} = 1`, [alias, tid]
  );
}

async function insertPlayer(db, tid, userId, alias, role) {
  const { run } = _wrap(db);
  
  return run(
    `INSERT INTO tournament_players (tournament_id, user_id, alias, ${ROLE_COL}, status, verified)
     VALUES (?, ?, ?, ?, 'ready', 1)`, [tid, userId, alias, role]
  );
}

function removePlayerFromTournament(db, tournamentId, role)
{
  const {run} = _wrap(db);
  return run(
    `DELETE FROM tournament_players
     WHERE tournament_id = ?
      AND player_role = ?`,
      [tid, role]
  );
}

async function getUserByCredentials(db, username, password) {
  const { get } = _wrap(db);
  const row = await get(
    `SELECT id, username, password, avatar_file FROM users WHERE username = ?`,
    [username]
  );
  if (!row) return null;
  const ok = bcrypt.compare(password, row.password);
  if (!ok) return null;
  return {
    id: row.id,
    username: row.username,
    avatar_file: row.avatar_file
  };
}

async function insertInitialBracket(db, tid, s1, s2, s3, s4) {
  const { run } = _wrap(db);
  await run(
    `INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
     VALUES (?, 1, 1, ?, ?, 'pending')`, [tid, s1, s4]
  );
  await run(
    `INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
     VALUES (?, 1, 2, ?, ?, 'pending')`, [tid, s2, s3]
  );
  await run(
    `INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
     VALUES (?, 2, 1, NULL, NULL, 'pending')`, [tid]
  );
}

async function startTournament(db, tid) {
  const w = _wrap(db);
  return w.tx(async ({ get }) => {
    const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
    if (!t) { const e = new Error('Tournament not found'); e.statusCode = 404; throw e; }
    // if (t.status !== 'waiting') { const e = new Error('Tournament already started'); e.statusCode = 409; throw e; }
    const players = await getTournamentPlayers(db, tid);
    if (players.length !== 4) { const e = new Error('Tournament requires exactly 4 players'); e.statusCode = 409; throw e; }
    const byRole = r => players.find(p => p.role === r)?.user_id;
    const s1 = byRole(1), s2 = byRole(2), s3 = byRole(3), s4 = byRole(4);
    if (!s1 || !s2 || !s3 || !s4) { const e = new Error('Roles 1–4 must be assigned'); e.statusCode = 409; throw e; }
    await insertInitialBracket(db, tid, s1, s2, s3, s4);
    await setTournamentStatus(db, tid, 'ongoing');
    return true;
  });
}

function toTournamentPlayer(row, viewingUserId, fallbackRole) {
  if (!row) {
    return { username: '', alias: '', status: 'waiting', avatar: undefined, score: undefined, isSelf: false, isVerified: false, role: fallbackRole };
  }
  return {
    username: row.username || '',
    alias: row.alias || '',
    status: row.status,
    avatar: row.avatar || undefined,
    score: undefined,
    isSelf: row.user_id === viewingUserId,
    isVerified: !!row.verified,
    role: `player${row.role}`,
  };
}

async function buildTournamentState(db, tid, viewingUserId) {
  const t = await getTournamentById(db, tid);
  if (!t) return null;
  const playersRows = await getTournamentPlayers(db, tid);
  const games = await getGamesForTournament(db, tid);
  const playersById = new Map(playersRows.map(r => [r.user_id, r]));
  const players = [1,2,3,4].map(n => toTournamentPlayer(
    playersRows.find(r => r.role === n), viewingUserId, `player${n}`
  ));
  const rounds = Math.max(0, ...games.map(g => g.round || 0));
  const bracket = rounds ? Array.from({length: rounds}, (_, i) => {
    const r = i + 1;
    return games.filter(g => g.round === r).map(g => {
      const p1 = toTournamentPlayer(playersById.get(g.p1_id), viewingUserId, 'player1');
      const p2 = toTournamentPlayer(playersById.get(g.p2_id), viewingUserId, 'player2');
      const score = (g.p1_score != null || g.p2_score != null) ? { player1: g.p1_score ?? 0, player2: g.p2_score ?? 0 } : undefined;
      const winner = g.winner_id ? (playersById.get(g.winner_id)?.username || '') : undefined;
      return { match_id: String(g.game_id), player1: p1, player2: p2, winner, score, status: ['pending','ongoing','finished'].includes((g.status||'').toLowerCase()) ? g.status : 'pending' };
    });
  }) : [];
  const state = {
    tournament_id: String(t.id),
    status: t.status,
    owner: players.find(p => p.role === 'player1')?.username || '',
    players,
    ...(bracket.length ? { bracket } : {}),
    can_start: playersRows.length === 4 && playersRows.every(r => !!r.verified),
    pending_players: players.filter(p => !p.isVerified).length,
  };
  const current = bracket.flat().find(m => m.status === 'ongoing');
  if (current) state.currentMatch = current;
  if (t.winner_id) {
    const w = playersById.get(t.winner_id);
    if (w?.username) state.winner = w.username;
  }
  return state;
}

async function createTournamentWithOwner(db, creatorId) {
  const w = _wrap(db);
  return w.tx(async ({ get, run }) => {
    const u = await get(`SELECT username FROM users WHERE id = ?`, [creatorId]);
    // const alias = (ownerAlias || u?.username || 'player1').trim();
    const insT = await run(`INSERT INTO tournaments (status) VALUES ('waiting')`, []);
    const tid = insT.lastID;
    await run(
      `INSERT INTO tournament_players (tournament_id, user_id, alias, ${ROLE_COL}, verified)
       VALUES (?, ?, 'Alias', 1, 1)`,
      [tid, creatorId]
    );
    return tid;
  });
}

async function markOngoingIfFull(db, tid)
{
  const w = _wrap(db);
  return w.tx(async ({get, all, run}) => {
		const t = await get('SELECT id, status FROM tournaments WHERE id = ?', [tid]);
		if (!t) { const e = new Error('Tournament not found'); e.statusCode = 404; throw e; }
    if (t.status === 'finished' || t.status === 'closed')
    {
      const e = new Error(`Tournament cannot be modified in status ${t.status}`);
      e.statusCode = 409; throw e;
    }
    if (t.status === 'ongoing') return {changed: false};
    const pl = await all(
      `SELECT ${ROLE_COL} AS role, verified
       FROM tournament_players
       WHERE tournament_id = ?`, [tid]
    );
    const full = pl.length === 4 && pl.every(p => p.verified);
    const roles = new Set(pl.map(p => p.role));
    const rolesOK = [1, 2, 3, 4].every(r => roles.has(r));
    if (full && rolesOK)
    {
      await run(`UPDATE tournaments SET status = 'ongoing' WHERE id = ?`, [tid]);
      return {changes: true};
    }
    return {changes: false};
  });
}

async function cancelTournament(db, tid, hostId)
{
	const w = _wrap(db);
	return w.tx(async ({get, run}) => {
		const t = await get('SELECT id, status FROM tournaments WHERE id = ?', [tid]);
		if (!t) { const e = new Error('Tournament not found'); e.statusCode = 404; throw e; }
		if (t.status === 'finished') { const e = new Error('Tournament already finished'); e.statusCode = 409; throw e; }
		const host = await get(
			`SELECT user_id FROM tournament_players WHERE tournament_id = ? AND role = 1`,
			[tid]
		);
		if (!host || host.user_id !== hostId) { const e = new Error('Only host can cancel'); e.statusCode = 403; throw e; }
		await run (`DELETE FROM tournaments WHERE id = ?`, [tid]);
		return true;
	});
}

async function closeTournament(db, tid, userId)
{
  const w = _wrap(db);
  return w.tx(async ({get, run}) => {
    const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
    if (!t) {const e = new Error('Tournament not found'); e.statusCode = 403; throw e;}
    if (t.status === 'closed') {const e = new Error('Tournament already closed'); e.statusCode = 409; throw e;}
    const host = await get(
      `SELECT userd_id FROM tournament_players WHERE tournament_id = ? AND role = 1`, [tid]);
    if (!host || host.user_id !== userId)
    {
      const e = new Error('Only host can close'); e.statusCode = 403; throw e;
    }
    await run(`UPDATE tournaments SET status = 'closed' WHERE id = ?`, [tid]);
    return true;
  });
}

function startTournamentMatch(db, tid, matchId, hostId)
{
  const w =_wrap(db);
  return w.tx(async ({get, run}) => {
    const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
    if (!t) {const e = new Error('Tournament not found'); e.statusCode = 404; throw e;}
    if (t.status !== 'ongoing') { const e = new Error('Tournament is not ongoing'); e.statusCode = 409; throw e; }
    const host = await get(
      `SELECT user_id FROM tournament_players WHERE tournament_id = ? AND ${ROLE_COL} = 1`, [tid]
    );
    if (!host || host.user_id !== hostId) { const e = new Error('Only host can start game'); e.statusCode = 403; throw e; }
    const game = await get(
      `SELECT id, status FROM games WHERE id = ? AND tournament_id = ?`, [matchId, tid]
    );
    if (!game) { const e = new Error('Match not found'); e.statusCode = 404; throw e; }
    if (game.status === 'finished') { const e = new Error('Match already finished'); e.statusCode = 409; throw e; }
    const twoMatches = await get(
      `SELECT id FROM games WHERE tournament_id = ? AMD status = 'ongoing'`
    );
    if (twoMatches && twoMatches.id !== game.id) { const e = new Error('Another match already ongoing'); e.statusCode = 409; throw e; }
    await run(`UPDATE games SET status = 'ongoing' WHERE id = ?`, [game.id]);
    return true;
  });
}

module.exports = {
  _wrap,
  ROLE_COL,
  getActiveTournamentForUser,
  getTournamentById,
  getTournamentPlayers,
  getGamesForTournament,
  setTournamentStatus,
  isRoleTaken,
  upsertHostAlias,
  insertPlayer,
  removePlayerFromTournament,
  getUserByCredentials,
  insertInitialBracket,
  startTournament,
  buildTournamentState,
  createTournamentWithOwner,
  markOngoingIfFull,
  cancelTournament,
  closeTournament,
  startTournamentMatch
};