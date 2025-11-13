
const {
	initGame,
	updateKeys,
} = require('../pong_game/pong_server.js');

const {logger, log} = require('@logger');
const flog = logger.child({ fileContext: 'messageHandler.js' }); // scoped logger
const {
  handleGreet,
  startLoop,
  initPlayer,
  getGameContext,
} = require('./handlers.js');

const {
	updatePlayerGameStats,
	updateMatchHistory,
} = require('@db/update.js');

const {
	updateTournamentStats,
	updateBracket,
} = require('@db/tournament.js');

const { addPlayer } = require("@Rgame");

// let ws;
let playerinit = false;
let paused = false;

function handleMessage(ws, data) {
	// ws = ws; // this will have to be changed for remote play
	const context = getGameContext(ws, data, playerinit);
	const {game, gameState} = context || {};
	if (data.type != 'keys')
		flog.debug('Message received: (Ignoring keypresses)', data);
	switch (data.type) {
		case 'greet':
			handleGreet(ws, data);
			break;
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong', payload: 'Pong!' }));
			break;
		case 'pause':
		{
			flog.info('Game paused');//Error 
			if (!gameState)
			{
				flog.error('Pause called but no gameState found', {data});
			}
			if (gameState.loop) {
				clearInterval(gameState.loop);
				gameState.loop = undefined; // mark as stopped
				gameState.gameRunning = false; // optional flag
				paused = true;
			}
			break;
		}
		case 'initPlayer':{
			// this fucntion dosnt care about if remote or local
			flog.info('Starting player init');
			initPlayer(ws, data.token);
			log('PLAYER INIT CASE::', 'after init ');
			playerinit = true;
			flog.info('Finnished player init');
			ws.send(JSON.stringify({type: 'playerInit_ack', message: 'player init success' }));
			break;
		}
		case 'getPlayerNames': {
			// const player1 = [...game.players.values()].find(player => player.role === "player1");
			// const player2 = [...game.players.values()].find(player => player.role === "player2");
			ws.send(JSON.stringify({
				type: 'playerNames',
				player1: (player1.alias ? player1.alias : "Player 1"),
				player2: (player2.alias ? player2.alias : "Player 2")
			}));
			break;
		}
		case 'resetPositions': {
			const resetAll = !data.resetTargets || data.resetTargets.length === 0;
			if (resetAll || data.resetTargets.includes("paddles")) {
				gameState.positions[gameState.leftPaddleI] = gameState.paddleOffset;
				gameState.positions[gameState.rightPaddleI] = gameState.width - gameState.paddleOffset;
			} if (resetAll || data.resetTargets.includes("ball")) {
				gameState.positions[gameState.ballYI] = gameState.height / 2;
				gameState.positions[gameState.ballXI] = gameState.width / 2;
			} if (resetAll || data.resetTargets.includes("gameRunning")) {
				gameState.gameRunning = true;
                gameState.firstHit = false;
			}
			break;
		}
		case 'resetScore': { // used in a test from pong_game/index.html
			const player1 = [...game.players.values()].find(player => player.role === "player1");
			const player2 = [...game.players.values()].find(player => player.role === "player2");
			player1.score = 0;
			player2.score = 0;
			break;
		}
		case 'gameOver': {
			const gameId = ws ? ws.gameId || game.gameId : game.gameId;
			const [id1, player1] = [...game.players.entries()]
				.find(([_, p]) => p.role === 'player1');
			const [id2, player2] = [...game.players.entries()]
				.find(([_, p]) => p.role === 'player2');
			if (!player1.alias) player1.alias = player1.type === 'login' ? `User${id1}` : player1.type === 'ai' ? 'AI Bot' : 'Guest';
			if (!player2.alias) player2.alias = player2.type === 'login' ? `User${id2}` : player2.type === 'ai' ? 'AI Bot' : 'Guest';
			if (!player1.id) player1.id = id1;
			if (!player2.id) player2.id = id2;
			flog.info(`[WS] Player1: ${player1.alias} (${player1.type}), score: ${player1.score}`);
			flog.info(`[WS] Player2: ${player2.alias} (${player2.type}), score: ${player2.score}`);
			const player1Won = player1.score > player2.score;
			const winnerId = player1Won ? id1 : id2;
			const loserId = player1Won ? id2 : id1;
			const winner = player1Won ? player1 : player2;
			const loser = player1Won ? player2 : player1;
			flog.info(`[WS] Winner: ${winner.alias} (${winner.type})`);
  			flog.info(`[WS] Loser: ${loser.alias} (${loser.type})`);

			// helper function to handle stats update per player
			const updateStatsIfLogin = async (isWinner, playerId, player, opponent) => {
				if (player.type === 'login') {
				flog.info(`[WS] Updating stats for ${player.alias} with id ${playerId} (${isWinner ? 'WIN' : 'LOSS'})`);
				await updatePlayerGameStats(isWinner, playerId, player.score);
				await updateMatchHistory(
					playerId,
					isWinner ? 'win' : 'loss',
					player.score,
					player.type,
					opponent.id,
					opponent.score,
					opponent.type
				);
				flog.info(`[WS] ✅ Stats updated for ${player.alias}`);
				}
				else
					flog.info(`[WS] ⏭️ Skipping stats update for ${player.alias} (${player.type})`);
			};

			Promise.all([
				updateStatsIfLogin(true, winnerId, winner, loser),
				updateStatsIfLogin(false, loserId, loser, winner)
			])
				.then(() => {
//				console.log(`[WS] 🏁 Stats updated for Game ${gameId}`);
				})
				.catch(err => {
//				console.error(`[WS] ❌ Failed to update game stats for Game ${gameId}`, err);
				});
			if (game.mode === "tournament") {

				updateTournamentStats(gameId, player1.score, player2.score, "finished", winnerId)
					.then(() => {
					flog.info(`[WS] ✅ Tournament stats updated for Game ${gameId}`);
					})
					.catch(err => {
					flog.error(`[WS] ❌ Failed to update tournament stats for Game ${gameId}`, err);
					});

				const winnerData = player1Won ? player1 : player2;

				updateBracket(game.tid, winnerId, 2)
					.then(result => {
					const { gameId: gameId, slot } = result;
					const playerRole = slot === 'p1_id' ? 'player1' : 'player2';
					console.log(`[WS] 🧩 Updating bracket: adding ${winnerData.alias} as ${playerRole} in next game ${gameId}`);

					addPlayer(gameId, winnerId, {
						type: "login",
						ws: undefined,
						role: playerRole,
						alias: winnerData.alias,
						ready: true,
						disconnectedAt: undefined,
						pauseTimeout: undefined,
						score: 0
					});

					console.log(`[WS] ✅ Winner ${winnerData.alias} added to next tournament game ${gameId}`);
					})
					.catch(err => {
					console.error(`[WS] ❌ Failed to update tournament bracket for Tournament ${game.tid}`, err);
					});
				}
			break;
		}
		case 'init': {
			// if remote initgame should only happen for player1
			initGame(gameState, data.payload); // payload = { height, width, ballSize, paddleSize, paddleOffset, ballSpeed, paddleSpeed, powerUp }
			ws.send(JSON.stringify({type: 'init_ack', message: 'game init success' }));
            gameState.powerups = data.payload.powerups;
		}
			break;
		case 'keys':{
			updateKeys(gameState, data.payload); // update keys in game state
			break;
		}
		case "start_loop":{
			// if remote this should only start once player 1 and player 2 have initilized and player 1 has initilized the game
			// then this should be updated to startloop for both player websockets
			// const {ws, ...player1Debug} = [...game.players.values()].find(player => player.role === "player1");
			// const player2Debug = [...game.players.values()].find(player => player.role === "player2");
			// const [player1, player2] = [...game.players.values()].slice(0, 2);
			const player1 = [...game.players.values()].find(player => player.role === "player1");
			const player2 = [...game.players.values()].find(player => player.role === "player2");
			flog.debug({fucntion: 'MessageHandler startLoop', player1, player2});
			if (!player1 || !player2)
			{
				console.log("Error getting players");
				console.log("Player1: ", player1);
				console.log("Player2: ", player2);
				return;
			}
			startLoop(ws, gameState, player1, player2);
			break;
		}
		case "reconnect": {
			paused = false; // may have future use, should be stored in game object
			ws.send(JSON.stringify(gameState.positions));
			if (!gameState.loop) {
				gameState.gameRunning = true;
				const player1 = [...game.players.values()].find(player => player.role === "player1");
				const player2 = [...game.players.values()].find(player => player.role === "player2");
				startLoop(ws, gameState, player1, player2);
				console.log("Game resumed");
			}
			break;
		}
		case "end": {
			// do we use game phase === end to detemrine this? or does front end send me it in this case
			//update scores in database
			// stop game loop
			// send final scores to both players
			// clean up game state
			console.log("Game ended");
			const player1 = [...game.players.values()].find(player => player.role === "player1");
			const player2 = [...game.players.values()].find(player => player.role === "player2");
			if (!player1 || !player2)
			{
				flog.error('Game end requested but players not found', {players: [...game.palyers.values()]});
				break;
			}
			ws.send(JSON.stringify({ type: 'game_end', payload: gameState.positions, player1: player1.score, player2: player2.score }));
			}
			break;
		case "close": {

			console.log("Game closed by player");
			ws.send(JSON.stringify({ type: 'game_closed', message: 'Game closed by player' }));
		}
			break;
		default:
			console.error('Unknown message type:', data.type);
			ws.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}
}

module.exports = { handleMessage };

