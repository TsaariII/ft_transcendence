
const {logger} = require('@logger');
const flog = logger.child({fileContext: 'game.js'});
const {miniLogin} = require('@db/get.js');
const {API_PROTOCOL} = require('@sharedApi');
const {insertGame} = require('@db/game.js');
const tournament = require('./tournament/tournament');
const DBtournament = require('@db/tournament.js');
const {_wrap} = require('@db/tournament.js');
const games = new Map();

function generateRandomId() { return Math.random().toString(36).substring(2, 10); }

function createGameMap(gameDbId, hostId, type, mode)
{
	const gameId = String(gameDbId);
	games.set(gameId, {
		hostId,
		type,
		mode,
		state: {},
		loop: undefined,
		phase: 'setup',
		players: new Map(),
		payload: {
			fps: 60,
			height: 1,
			width: 1,
			ballSize: 1,
			paddleHeight: 1,
			paddleWidth: 1,
			paddleOffset: 1,
			paddleSpeed: 0,
			ballSpeed: 0,
			ballSpeedUp: 1,
			leftPaddleI: 0,
			rightPaddleI: 1,
			ballYI: 2,
			ballXI: 3,
			positions: [100, 100, 100, 100],
			ball: {dx: 3, dy: 1},
			gameRunning: false,
			keysDown: [false, false, false, false],
			lastUpdate: undefined,
			powerups: false,
			visiblePowerups: [],
			activePowerups: [],
			firstHit: false
		}
	});
	return gameId;
}

function getGame(gameId) { return games.get(gameId); }

function deleteGame(gameId) { return games.delete(gameId); }

function addPlayer(gameId, playerId, playerData)
{
	const game = games.get(gameId);
	if (!game) throw new Error('Game not found');
	game.players.set(playerId, playerData);
}

async function createGameCore(hostId, type, mode, alias)
{
	try
	{
		const row = await insertGame({
			tournamentId: null,
			p1_id: hostId || null,
			p2_id: null,
			type,
			mode,
			round: null,
			bracket_pos: null,
			status: 'pending'
		})
		const gameId = createGameMap(row.id, hostId, type, mode);
		if (hostId)
		{
			addPlayer(gameId, hostId, {
				type: 'login',
				ws: undefined,
				role: 'player1',
				alias: alias || undefined,
				ready: false,
				disconnectedAt: undefined,
				pauseTimeout: undefined,
				score: 0
			});
		}
		return gameId;
	}
	catch (err) { throw new Error('Game initialization failed'); }
}

async function createGame(fastify)
{
	fastify.post(API_PROTOCOL.CREATE_GAME.path, async (request, reply) => {
		const {type, mode} = request.body || {};
		const hostId = request.userId;
		if (!hostId)
			return reply.code(401).send({error: 'Authentiction required'});
		const allowedTypes = ['login', 'ai', 'guest'];
		if (!allowedTypes.includes(type))
			return reply.code(400).send({error: 'Invalid game type'});
		const allowedModes = ['vs', 'tournament'];
		if (!allowedModes.includes(mode))
			return reply.code(400).send({error: 'Invalid game mode'});
		try
		{
			const gameId = await createGameCore(hostId, type, mode, undefined);
			return reply.send({status: 'Game created', gameId});
		}
		catch (err) { return reply.code(400).send({error: 'Game initialization failed'}); }
	});
}

async function joinGame(fastify)
{
	fastify.post(API_PROTOCOL.JOIN_GAME.path, async (request, reply) => {
		const {gameId, type, username, password, player_count} = request.body || {};
		if (!gameId || typeof gameId !== 'number' && typeof gameId !== 'string')
			return reply.code(400).send({error: 'Invalid game id'});
		const game = getGame(String(gameId));
		if (!game)
			return reply.code(404).send({error: 'Game not found'});
		if (game.players.size >= 2)
			return reply.code(409).send({error: 'Game is already full'});
		try
		{
			let userId;
			if (type === 'login')
			{
				const p2ID = await miniLogin(username, password);
				userId = String(p2ID.id);
			}
			else if (type === 'guest')
				userId = 'Guest_' + generateRandomId();
			else if (type === 'ai')
				userId = 'AI_' + generateRandomId();
			else
				return reply.code(400).send({error: 'Unknown player type'});
			addPlayer(String(gameId), userId,{
				type,
				ws: undefined,
				role: 'player' + player_count,
				alias: undefined,
				ready: false,
				disconnectedAt: undefined,
				pauseTimeout: undefined,
				score: 0
			});
			return reply.send({player: 'player' + player_count, status: 'ready'});
		}
		catch (err){ return reply.code(400).send({error: 'Player can not be added'}); }
	});
}

function startGameCore(secure, gameId)
{
	const game = getGame(gameId);
	if (!game) return {error: 'Game not found', code: 404};
	if (!game.players || game.players.size < 2)
		return {error: 'Not enough players to start', code: 400};
	const playerTokens = {};
	for (const [playerId, playerData] of game.players)
	{
		const role = playerData.role;
		if (!role) continue;
		playerTokens[role] = secure.generateWsToken(playerId, gameId);
	}
	game.phase = 'starting';
	return {playerTokens};
}

async function startGame(fastify, options)
{
	const {secure, db} = options;
	fastify.post(API_PROTOCOL.START_GAME.path, async (request, reply) => {
		const {gameId, tournamentId} = request.body || {};
		try
		{
			if (tournamentId)
			{
				let game = getGame(String(gameId));
				if (!game || tournamentId)
				{
					const {get} = _wrap(db);
					const row = await get(
						`SELECT id, p1_id, p2_id, type, mode
						FROM games
						WHERE id = ? AND tournament_id =? `, [gameId, tournamentId]
					);
					if (!row)
						return reply.code(404).send({error: 'Game not found'});
					const inMemId = createGameMap(row.id, row.p1_id, 'login', 'tournament');
					game = getGame(String(inMemId));
					game.tid = tournamentId;
					game.mode = 'tournament';
					if (row.p1_id)
					{
						addPlayer(String(inMemId), String(row.p1_id), {
							type: 'login',
							ws: undefined,
							role: 'player1',
							alias: undefined,
							ready: false,
							disconnectedAt: undefined,
							pauseTimeout: undefined,
							score: 0
						});
					}
					if (row.p2_id)
					{
						addPlayer(String(inMemId), String(row.p2_id), {
							type: 'login',
							ws: undefined,
							role: 'player2',
							alias: undefined,
							ready: false,
							disconnectedAt: undefined,
							pauseTimeout: undefined,
							score: 0
						});
					}
				}

			}
			const result = startGameCore(secure, gameId);
			if (result.error) return reply.code(result.code || 400).send({error: result.error});
			if (!reply.sent)
			{
				return reply.send({
					status: 'ready',
					gameId,
					playerTokens: result.playerTokens
				});
			}
		}
		catch (err)
		{
			if (!reply.sent)
			{
				return reply.code(418).send({
					error: 'Game initialization failed'
				});
			}
		}
	});
}
// {
// 	const {secure} = options;
// 	fastify.post(API_PROTOCOL.START_GAME.path, async (request, reply) => {
// 		const {gameId} = request.body || {};
// 		try
// 		{
// 			const result = startGameCore(secure, gameId);
// 			if (result.error) return reply.code(result.code || 400).send({error: result.error});
// 			if (!reply.sent)
// 			{
// 				return reply.send({
// 					status: 'ready',
// 					gameId,
// 					playerTokens: result.playerTokens
// 				});
// 			}
// 		}
// 		catch (err)
// 		{
// 			if (!reply.sent)
// 			{
// 				return reply.code(418).send({
// 					error: 'Game initialization failed'
// 				});
// 			}
// 		}
// 	});
// }

async function gameRoutes(fastify, options)
{
	await createGame(fastify, options);
	await joinGame(fastify, options);
	await startGame(fastify, options);	
}

module.exports = {
	gameRoutes,
	startGame,
	joinGame,
	createGame,
	getGame,
	generateRandomId,
	createGameCore,
	addPlayer,
	startGameCore
}
