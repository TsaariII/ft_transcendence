
const {initGame, updateKeys} = require('../pong_game/pong_server.js');
const {logger, log} = require('@logger');
const flog = logger.child({fileContext: 'messageHandler.js'});

const {
	handleGreet,
	startLoop,
	initPlayer,
	getGameContext
} = require('./handlers.js');
const {updatePlayerGameStats} = require('@db/update.js');
const {updateGameResult} = require('@db/game.js');

const {updateTournamentStats, updateBracket} = require('@db/tournament.js');

const {addPlayer} = require('@Rgame');
const { _wrap } = require('../database/tournament.js');

let playerInit = false;
let paused = false;


function safeSend(ws, payload)
{
	if (!ws) return;
	try { ws.send(JSON.stringify(payload)); }
	catch (err) {}
}

function getPlayersOrLog(game, contextLabel)
{
	if (!game) return {player1: null, player2: null};
	const player1 = [...game.players.values()].find((p) => p.role === 'player1');
	const player2 = [...game.players.values()].find((p) => p.role === 'player2');
	// if (!player1 || !player2)
	return {player1, player2};
}

function ensureAliasAndId(entry, fallbackId)
{
	const [id, player] = entry || {};
	if (!player) return {id: fallbackId, player: null};
	if (!player.alias)
	{
		if (player.type === 'login')
			player.alias = `User${id}`;
		else if (player.type === 'ai')
			player.alias = 'AI bot';
		else
			player.alias = 'Guest';
	}
	if (!player.id)
		player.id = id;
	return {id, player};
}

function createMessageHandler(db)
{
	function handleMessage(ws, data)
	{
		const context = getGameContext(ws, data, playerInit);
		const {game, gameState} = context || {};
		const requireContextFor = [
			'pause',
			'getPlayerNames',
			'resetPositions',
			'resetScore',
			'gameOver',
			'init',
			'keys',
			'start_loop',
			'reconnect',
			'end'
		];
		if (requireContextFor.includes(data.type) && (!game || !gameState))
		{
			if (ws)
				safeSend(ws, {error: 'Game session is not initialized'});
			return;
		}
		switch (data.type)
		{
			case 'greet':
			{
				handleGreet(ws, data);
				break;
			}
			case 'ping':
			{
				safeSend(ws, {type: 'pong', payload: 'Pong!'});
				break;
			}
			case 'pause':
			{
				if (!gameState) break;
				if (gameState.loop)
				{
					clearInterval(gameState.loop);
					gameState.loop = undefined;
					gameState.gameRunning = false;
					paused = true;
				}
				break;
			}
			case 'initPlayer':
			{
				initPlayer(ws, data.token);
				playerInit = true;
				safeSend(ws, {type: 'playerInit_ack', message: 'player init success'});
				if (!player1 || !player2) break;
				safeSend(ws, {
					type: 'playerNames',
					player1: player1.alias || 'Player 1',
					player2: player2.alias || 'Player 2'
				});
				break;
			}
			case 'resetPositions':
			{
				const resetAll = !data.resetTargets || data.resetTargets.length === 0;
				if (resetAll || data.resetTargets.includes('paddles'))
				{
					gameState.positions[gameState.leftPaddleI] = gameState.paddleOffset;
					gameState.positions[gameState.rightPaddleI] = gameState.width - gameState.paddleOffset;
				}
				if (resetAll || data.resetTargets.includes('ball') || data.resetTargets.includes('gameRunning'))
				{
					gameState.positions[gameState.ballYI] = gameState.height / 2;
					gameState.positions[gameState.ballXI] = gameState.width / 2;
				}
				if (resetAll || data.resetTargets.includes('gameRunning'))
				{
					gameState.gameRunning = true;
					gameState.firstHit = false;
					gameState.ballSpeedUp = 1;
				}
				break;
			}
			case 'resetScore':
			{
				const {player1, player2} = getPlayersOrLog(game, 'resetScore');
				if (!player1 || !player2) break;
				player1.score = 0;
				player2.score = 0;
				break;
			}
			case 'gameOver':
			{
				const gameId = ws ? ws.gameId || game.gameId : game.gameId;
				if (!gameId) break;
				const p1Entry = [...game.players.entries()].find(([, p]) => p.role === 'player1');
				const p2Entry = [...game.players.entries()].find(([, p]) => p.role === 'player2');
				const {id: id1, player: player1} = ensureAliasAndId(p1Entry, 'p1');
				const {id: id2, player: player2} = ensureAliasAndId(p2Entry, 'p2');
				if (!player1 || !player2) break;
				const player1Won = player1.score > player2.score;
				const dbP1Id = player1.type === 'login' ? id1 : null;
				const dbP2Id = player2.type === 'login' ? id2 : null;
				let winnerDbId = null;
				if (player1Won && player1.type === 'login') winnerDbId = dbP1Id;
				else if (!player1Won && player2.type === 'login') winnerDbId = dbP2Id;
				const promises = [];
				const isRankedGame = game.type === 'login';
				if (isRankedGame)
				{
					if (dbP1Id !== null && dbP2Id !== null && dbP1Id !== dbP2Id)
					{
						if (dbP1Id !== null)
							promises.push(updatePlayerGameStats(player1Won, dbP1Id, gameId));
						if (dbP2Id !== null)
							promises.push(updatePlayerGameStats(!player1Won, dbP2Id, gameId));
					}
				}
				promises.push(updateGameResult(gameId, {
					p1_id: dbP1Id,
					p2_id: dbP2Id,
					p1_score: player1.score,
					p2_score: player2.score,
					winner_id: winnerDbId,
					status: 'finished'
				}));
				Promise.all(promises).catch((err) => {});
				if (game.mode === 'tournament' && game.tid && winnerDbId)
				{
					updateTournamentStats(db, gameId, player1.score, player2.score, 'finished', winnerDbId).catch((err) => {});
					const winnerData = player1Won ? player1 : player2;
					const {get} = _wrap(db);
					get(`SELECT round FROM games WHERE id = ?`, [gameId])
					.then((row) => {
						const round = row?.round ?? 1;
						return updateBracket(db, game.tid, winnerDbId, round);
					}).then((result) => {
						const {gameId: nextGameId, slot} = result;
						if (!nextGameId || !slot) return;
						const playerRole = slot === 'p1_id' ? 'player1' : 'player2';
						addPlayer(String(nextGameId), winnerDbId, {
							type: 'login',
							ws: undefined,
							role: playerRole,
							alias: winnerData.alias,
							ready: true,
							disconnectedAt: undefined,
							pauseTimeout: undefined,
							score: 0
						});
					}).catch((err) => {});
				}
				break;
			}
			case 'init':
			{
				initGame(gameState, data.payload);
				gameState.powerups = data.payload.powerups;
				safeSend(ws, {type: 'init_ack', message: 'Game init success'});
				break;
			}
			case 'keys':
			{
				updateKeys(gameState, data.payload);
				break;
			}
			case 'start_loop':
			{
				const {player1, player2} = getPlayersOrLog(game, 'start_loop');
				if (!player1 || !player2) break;
				startLoop(ws, gameState, player1, player2);
				break;
			}
			case 'reconnect':
			{
				paused = false;
				if (gameState)
				{
					safeSend(ws, gameState.positions);
					if (!gameState.loop)
					{
						gameState.gameRunning = true;
						const {player1, player2} = getPlayersOrLog(game, 'reconnect');
						if (!player1 || player2) break;
						startLoop(ws, gameState, player1, player2);
					}
				}
				break;
			}
			case 'end':
			{
				const {player1, player2} = getPlayersOrLog(game, 'end');
				if (!player1 || !player2) break;
				safeSend(ws, {
					type: 'game_end',
					payload: gameState.positions,
					player1: player1.score,
					player2: player2.score
				});
				break;
			}
			case 'close':
			{
				safeSend(ws, { 
					type: 'game_closed',
					message: 'Game closed by player'
				});
				break;
			}
			default:
			{
				safeSend(ws, {error: 'Unknown message type'});
				break;
			}
		}
	}
	return handleMessage;
}


module.exports = {createMessageHandler};