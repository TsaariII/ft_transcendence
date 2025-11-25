const { API_PROTOCOL } = require('@sharedApi');
const bcrypt = require('bcrypt');
const {
  getActiveTournamentForUser,
  buildTournamentState,
  startTournament,
  createTournamentWithOwner,
  getUserByCredentials,
  insertPlayer,
  isRoleTaken,
  upsertHostAlias,
  markOngoingIfFull,
  cancelTournament,
  closeTournament
} = require('../../database/tournament.js'); // adjust path
const { getUserIdFromToken } = require('@security'); // adjust path

function roleStringToNumber(role) {
  const map = {
    player1: 1,
    player2: 2,
    player3: 3,
    player4: 4,
  };
  return map[role] ?? null;
}

const _wrap = (db) => ({
	run: (sql, params = []) => new Promise((res, rej) =>
		db.run(sql, params, function (err){
			if (err) return rej(err);
			else res({lastID: this.lastID, changes: this.changes});
		})
	),
	get: (sql, params = []) => new Promise((res, rej) =>
	db.get(sql, params, (e, row) => (e ? rej(e) : res(row || null)))
	),
	all: (sql, params = []) => new Promise((res, rej) =>
	db.all(sql, params, (e, rows) => (e ? rej(e) : res(rows || [])))
	),
	tx: async (fn) => {
		const run = (sql, p=[]) => _wrap(db).run(sql, p);
		await run('BEGIN');
		try{const r = await fn(); await run('COMMIT'); return r;}
		catch (e) {await run('ROLLBACK'); throw e;}
	}
});

module.exports = async function tournamentRoutes(fastify, options) {
	fastify.get(API_PROTOCOL.GET_ACTIVE_TOURNAMENT.path, async (request, reply) => {
		const { db } = options;
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });
		let userId; try { userId = getUserIdFromToken(token); } catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }

		const t = await getActiveTournamentForUser(db, userId);
		if (!t) return reply.send({ status: 'OK', tournament: null });
		const state = await buildTournamentState(db, t.id, userId);
		return reply.send({ status: 'OK', tournament: state });
	});

	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
		const { db } = options;
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });
		let userId; try { userId = getUserIdFromToken(token); } catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }
		const ownerAlias = typeof request.body?.alias === 'string' ? request.body.alias : undefined;
		try
		{
			const tid = await createTournamentWithOwner(db, userId, ownerAlias);
			const state = await buildTournamentState(db, tid, userId);
			return reply.code(201).send({ status: 'OK', tournament: state });
		}
		catch (err) {
			const msg = String(err?.message || '');
			if (msg.includes('UNIQUE') || msg.includes('constraint')) return reply.code(409).send({ status: 'ERROR', error: 'Tournament create conflict' });
			request.log.error({ err }, 'CREATE_TOURNAMENT');
			return reply.code(500).send({ status: 'ERROR', error: 'Create tournament failed' });
		}
	});

	fastify.post(API_PROTOCOL.VERIFY_PLAYER.path, async (request, reply) => {
		const { db } = options;
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });
		let userId; try { userId = getUserIdFromToken(token); } catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }
		request.log.info(
			{ params: request.params, body: request.body, cookies: Object.keys(request.cookies || {}) },
			'verify-player in'
		);
		const tid = Number(request.body?.tournament_id);
		const { role, alias, username, password } = request.body || {};
		if (!Number.isInteger(tid)) return reply.code(400).send({ status: 'ERROR', error: 'Invalid tournament id' });
		if (role === 'player1') {
			await upsertHostAlias(db, tid, String(alias || '').trim());
			const state = await buildTournamentState(db, tid, userId);
			return reply.send({ status: 'OK', tournament: state });
		}
		if (!['player2','player3','player4'].includes(role)) return reply.code(400).send({ status: 'ERROR', error: 'Role must be 2–4' });
		if (!alias || !username || !password) return reply.code(400).send({ status: 'ERROR', error: 'Missing fields' });
		if (await isRoleTaken(db, tid, role)) return reply.code(409).send({ status: 'ERROR', error: `Role ${role} already taken` });
		const u = await getUserByCredentials(db, username, password);
		if (!u) return reply.code(400).send({ status: 'ERROR', error: 'Invalid credentials' });
		const roleNum = roleStringToNumber(role);
		await insertPlayer(db, tid, u.id, String(alias).trim(), roleNum);
		await markOngoingIfFull(db, tid);
		const state = await buildTournamentState(db, tid, userId);
		return reply.send({ status: 'OK', tournament: state });
	});
	fastify.delete(API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path, async (request, reply) => {
		
	});
	fastify.post(API_PROTOCOL.START_TOURNAMENT.path, async (request, reply) => {
		const { db } = options;
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });
		let userId; 
		try { userId = getUserIdFromToken(token); }
		catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }
		const tid = Number(request.body?.tournament_id);
		if (!Number.isInteger(tid)) return reply.code(400).send({ status: 'ERROR', error: 'Invalid tournament id' });
		try
		{
			await startTournament(db, tid);
			const state = await buildTournamentState(db, tid, userId);
			return reply.send({ status: 'OK', tournament: state });
		}
		catch (err)
		{
			return reply.code(err.statusCode || 500).send({ status: 'ERROR', error: err.message || 'Failed to start tournament' });
		}
	});
	fastify.delete(API_PROTOCOL.CANCEL_TOURNAMENT.path, async (request, reply) => {
		const { db } = options;
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });

		let userId; try { userId = getUserIdFromToken(token); }
		catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }

		const active = await getActiveTournamentForUser(db, userId);
  		if (!active) return reply.code(404).send({ status: 'ERROR', error: 'No active tournament' });

		try {
			await cancelTournament(db, active.id, userId);
			return reply.send({ status: 'OK', tournament: null });
		} catch (err) {
			request.log.error({ err, tid }, 'CANCEL_TOURNAMENT failed');
			return reply.code(err.statusCode || 500).send({ status: 'ERROR', error: err.message || 'Failed to cancel tournament' });
		}
	});
	// fastify.post(API_PROTOCOL.CLOSE_TOURNAMENT.path, async (request, reply) => {
	// 	const {db} = options;
	// 	const token = request.cookies?.auth_token;
	// 	if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });
	// 	let userId; 
	// 	try { userId = getUserIdFromToken(token); }
	// 	catch { return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' }); }
	// 	const active = await getActiveTournamentForUser(db, userId);
	// 	if (!active) return reply.code(404).send({status: 'ERROR', error: 'No active tournament'});
	// 	try
	// 	{
	// 		await closeTournament(db, active.id, userId);
	// 		return reply.send({status: 'OK', tournament: null});
	// 	}
	// 	catch (err)
	// 	{
	// 		request.log.error({err, tid: active.id}, 'CLOSE_TOURNAMENT failed');
	// 		return reply.code(err.statusCode || 500).send({
	// 			status: 'ERROR', error: err.message || 'Failed to close tournament'
	// 		});
	// 	}
	// });
}