// Get data from URL params
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
const startData = JSON.parse(decodeURIComponent(urlParams.get('startData')));
const player1Token = urlParams.get('player1Token');
const player2Token = urlParams.get('player2Token'); // might be null if not provided
const gameSettingsRaw = urlParams.get('gameSettings');
let gameSettings = null;
if (gameSettingsRaw) {
	try {
		gameSettings = JSON.parse(decodeURIComponent(gameSettingsRaw));
	} catch (e) {
		console.error("Failed to parse gameSettings:", e);
	}
}
// somehow this logic needs to be token isntead of players, incase of remot eplay
if (player2Token) {
	console.log("Player 2 token detected:", player2Token);
	// Proceed with local multiplayer logic
} else {
	console.log("No Player 2 token — assuming remote or single-player mode");
	// Proceed with single-player or remote logic
}

console.log('game ID:', gameId);
console.log('token:', player1Token);

// window sizes and framerate etc
const height = window.innerHeight;
const width = window.innerWidth;
const paddleOffset = 100; // how far are paddles from window edges in pixels
const fps = 60; // don't change unless change also in server

const victory_score = gameSettings.maxScore;
const countdownTime = 3; // seconds

// key related
const controls = ["w", "s", "ArrowUp", "ArrowDown"];
const keysDown = [false, false, false, false];

// elements
const paddle1 = document.getElementById("paddle1");
const paddle2 = document.getElementById("paddle2");
const ball = document.getElementById("ball");

// Paddle offset aka distance from left/right edge of screen
paddle1.style.left = paddleOffset + "px";
paddle2.style.right = paddleOffset + "px";

// Paddle height and width
const paddleHeight = gameSettings.paddleSize;
const paddleWidth = paddleHeight / 10;
paddle1.style.height = paddleHeight + "px";
paddle2.style.height = paddleHeight + "px";
paddle1.style.width = paddleWidth + "px";
paddle2.style.width = paddleWidth + "px";

// Ball size
const ballSize = Math.min(height, width) / 20;
ball.style.height = ballSize + "px";
ball.style.width = ballSize + "px";

// Object positions will be in an array
let positions;

let gameReady = false;

// Websocket
const webSocket = new WebSocket(`wss://${window.location.host}/wss`);


// Player data
let p1Alias, p2Alias;
let p1Score, p2Score;

webSocket.onopen = (event) => {
	console.log("WebSocket connection opened.");
	console.log('Sending init message game id:', gameId);
	webSocket.send(JSON.stringify({gameId: gameId, type: 'initPlayer', token: player1Token}));
	
	// Update player aliases here or somewhere
	webSocket.send(JSON.stringify({ type: "getPlayerNames" }));
};

// This ends this script and returns to game page
function endFunction() {
	const winner = p1Score > p2Score ? p1Alias : p2Alias;
	const loser = p1Score > p2Score ? p2Alias : p1Alias;
	const data = {
		gameId: gameId,
		winner: winner,
		loser: loser ,
		score: [p1Score, p2Score]
	};
	window.parent.postMessage({
		type: "GAME RESULT",
		payload: data
	}, "*");
}

async function countdown() {
	for (let i = countdownTime; i > 0; --i) {
		document.getElementById("countdown").textContent = i.toString();
		await new Promise(r => setTimeout(r, 1000));
	}
	document.getElementById("countdown").textContent = "";
}

webSocket.onmessage = (event) => {
	if (typeof event.data !== 'string') {
		console.warn('Unexpected non-string WebSocket message:', event.data);
		return;
	} else {
		try {
			const data = JSON.parse(event.data);

			// Print debug into log
			if (data.type != 'update_game')
				console.log("game index.html received message:(ignoring positions update)", data);

			if (data.type == 'update_game') { // Receive updated positions
				// Set new positions
				positions = data.positions;

				// Update powerups
				if (gameSettings.powerUp) {
					const container = document.getElementById('powerup-container');
					container.innerHTML = '';  // Clear old powerups

					for (const powerup of data.visiblePowerups) {
						const div = document.createElement('div');

						div.className = 'rounded-full bg-purple-500 shadow-lg';

						div.style.position = 'absolute';
						div.style.top = `${powerup.y}px`;
						div.style.left = `${powerup.x}px`;
						div.style.width = `${powerup.radius}px`;
						div.style.height = `${powerup.radius}px`;

						container.appendChild(div);
					}
				}
			} else if (data.type == 'update_score') { // Receive this whenever score changes
				// Get winner. 0 means no winner yet
				let winner = 0;
				p1Score = data.player1_score;
				p2Score = data.player2_score;
				document.getElementById('p1Score').textContent = p1Score;
				document.getElementById('p2Score').textContent = p2Score;
				if (p1Score == victory_score) winner = 1;
				else if (p2Score == victory_score) winner = 2;
				if (winner == 0) { // game not finished yet
					countdown();
					webSocket.send(JSON.stringify({type: "resetPositions", resetTargets: ["ball"]}));
					document.getElementById("ball").classList.add("hidden");
					setTimeout(() => {
						webSocket.send(JSON.stringify({type: "resetPositions", resetTargets: ["gameRunning"]}));
						document.getElementById("ball").classList.remove("hidden");
					}, countdownTime * 1000);
				} else {
					// Update win declaration and show the div
					let endPrompt = document.getElementById("endPrompt");
					let endPromptText = document.getElementById("endPromptText");
					const text = (winner == 1 ? "🟢" : "🟣") + " 🏆";
					endPromptText.textContent = text;
					endPromptText.classList.add("text-" + (winner == 1 ? "blue" : "red") + "-500");
					
					endPrompt.classList.remove("hidden");
					webSocket.send(JSON.stringify({ type: "gameOver", gameId: gameId }));			
				}
			} else if (data.type == 'playerNames') { // Receive this when asked for player aliases
				p1Alias = data.player1;
				p2Alias = data.player2;
			} else if (data.type == 'welcome'){
				console.log(data.msg);
			} else if (data.type == 'init_ack'){
				webSocket.send(JSON.stringify({gameId: gameId, type: 'start_loop', token: player1Token}));
				gameReady = true;
			} else if (data.type == 'playerInit_ack') {
				webSocket.send(JSON.stringify({
					type: "init",
					gameId: gameId,
					token: player1Token,
					payload: {
						height: height,
						width: width,
						ballSize: ballSize,
						paddleHeight: paddleHeight,
						paddleWidth: paddleWidth,
						paddleOffset: paddleOffset,
						ballSpeed: gameSettings.ballSpeed,
						paddleSpeed: gameSettings.paddleSpeed,
						powerups: gameSettings.powerUp
					}
				}));
			} else {
				console.log("Not any expected message");
			}
		} catch (err) {
			console.error("Error:", err);
		}
	}
};

webSocket.onclose = (event) => {
	console.log("WebSocket connection closed.");
};

document.addEventListener("keydown", (e) => {
		for (let i = 0; i < 4; ++i) {
		if (e.key == controls[i]) keysDown[i] = true;
		}
		});

document.addEventListener("keyup", (e) => {
		for (let i = 0; i < 4; ++i) {
		if (e.key == controls[i]) keysDown[i] = false;
		}
		});

// Replacing this with some Babylon rendering
// is maybe as simple as it sounds. The following
// code is what updates the positions
function render() {
	if (!positions) return requestAnimationFrame(render);

	// Update static objects positions
	paddle1.style.top = positions[0] + "px";
	paddle2.style.top = positions[1] + "px";
	ball.style.top = positions[2] + "px";
	ball.style.left = positions[3] + "px";

	requestAnimationFrame(render);
}
requestAnimationFrame(render);

setInterval(() => {
		// send which keys are pressed down as json with payload
		if (webSocket.readyState === WebSocket.OPEN && gameReady) {
		webSocket.send(JSON.stringify({gameId: gameId, type: 'keys', payload: keysDown }));
		}

		//webSocket.send(JSON.stringify(keysDown));
		}, 1000 / fps);

(window as any).endFunction = endFunction;