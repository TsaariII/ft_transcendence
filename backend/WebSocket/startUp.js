const WebSocket = require('ws');
const handleMessage = require('./messageHandlers.js').handleMessage;
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'websockets/startUp.js' }); // scoped logger

function setUpWebSockets(server) {
	// this allows http and websocket to share same port
	const wss = new WebSocket.Server({ noServer: true});
	// WebSocket server setup AFTER Fastify is listening
	server.on('upgrade', (req, socket, head) => {
		flog.info('Upgrade request received');
		flog.info('Request URL:', req.url);
		flog.info('Headers:', req.headers);
		if (req.url === '/ws' || req.url === '/wss') {
			flog.info('Upgrade request received at /ws');
			wss.handleUpgrade(req, socket, head, (ws) => {
			wss.emit('connection', ws, req);
			});
		}
		else
		{
			flog.info('Unknown upgrade path:', req.url);
			socket.destroy();
		}
	});

	wss.on('connection', (ws, req) => {
		flog.info('WebSocket client connected');
		ws.on('message', (msg, isBinary) => {
			if (isBinary)
			{
        		flog.error('Received binary frame, rejecting');
				ws.send('Error: Binary messages are not supported');
				return;
			}
			let data;				
			try
			{
				const text = Buffer.isBuffer(msg) ? msg.toString() : msg;
				data = JSON.parse(text);
			}
			catch (err)
			{
				flog.error('Failed to parse JSON:', msg.toString());
				flog.error('Parse error:', err.message);
				ws.send('Error: Invalid format');
				return;
			}
			try { handleMessage(ws, data); }
			catch (err) { flog.error('Error in handleMessage:', err.message); }	
		});
		// grace period dosnt need token verification
		// if we want user to be able to reconnect outside grace period 
		// we will need to establish a token verification through apis 
		ws.on("close", () => {
			flog.info("Client disconnected");
			const player = ws.player;
			if (player) {
				
				player.disconnectedAt = Date.now();
				player.ws = null;
				handleMessage(undefined, { type: "pause", playerId: ws.playerId, gameId: ws.gameId });
				
				// Pause game logic if needed
			player.pauseTimeout = setTimeout(() => {
					// If still disconnected after 10s, end game or remove player
					//players.delete(playerId);
				flog.info("client died, bury them ");
				}, 10000);
			}
		});
	
		ws.on("error", (err) => {
			flog.error("WebSocket error:", err);
		});
		ws.send(JSON.stringify({type: 'welcome', msg: 'Welcome to the WebSocket server!'}));
	});

}

module.exports = setUpWebSockets; // not exporting as an object 
