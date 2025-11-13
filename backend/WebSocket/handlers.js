const { updateGame } = require('../pong_game/pong_server.js');
const { getGame } = require('@Rgame');
const { verifyToken } = require('@security');

function handleGreet(ws, data){
		console.log('Received greeting:', data.message);
		ws.send('Hello back!');
}

function startLoop(ws, gameState, player1, player2) {
	ws.send(JSON.stringify({
        type: "update_game", 
        positions: gameState.positions,
        visiblePowerups: gameState.visiblePowerups
    }));
	gameState.loop = setInterval(() => {
		if (updateGame(gameState, player1, player2) == 1) {
			ws.send(JSON.stringify({
                type: "update_score", 
                player1_score: player1.score, 
                player2_score: player2.score}));
        }
		ws.send(JSON.stringify({
            type: "update_game", 
            positions: gameState.positions,
            visiblePowerups: gameState.visiblePowerups
        }));
	}, 1000 / gameState.fps);

}
// each player must send their own init
function initPlayer(ws, token) {
  const session = verifyToken(token)//n(token, gameId); own fucntion here
	console.log("whats in session", session);
  if (!session) {
    ws.send(JSON.stringify({ error: 'Invalid session' }));
    ws.close();
    return;
  }

  attachPlayerToGame(ws, session);
  console.log("player inited");
//  ws.send(JSON.stringify({ status: 'connected ', playerId: session.playerId }));
}
//once both players have connected front end sends yes and we start the game
function attachPlayerToGame(ws, session) {
	ws.playerId = session.id;
	ws.gameId = session.gameId;

	const game = getGame(ws.gameId);
	//if (!game) return false; throw, make sure its being caught
	console.log('player id from token', ws.playerId);
    const player = game.players.get(ws.playerId);
	if (!player) {
		console.log("Player not found in game, player id", player.playerId,'player itesle', player);
		ws.send(JSON.stringify({ error: 'Player not found in game' }));
		ws.close();
		return;
	}
	ws.player = player
	console.log("Attached player to ws:", ws.player);
	player.ws = ws;
	player.ready = 'true';
	return true;
}

function getGameContext(ws, data, playerinit) {
    if (!playerinit) return undefined;

	const gameId = ws ? ws.gameId || data.gameId : data.gameId;
	const game = getGame(gameId);
    if (!game) return undefined;

    return {
        game,
        gameState: game.payload
    };
}
module.exports = {handleGreet, startLoop, initPlayer, getGameContext}

