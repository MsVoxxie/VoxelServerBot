// Example: subscribe.js (or inside your bot's main file)
const WebSocket = require('ws');
const logger = require('../logging/logger');

function subscribeToApi(client, apiWsUrl, data) {
	const ws = new WebSocket(apiWsUrl);

	ws.on('open', () => {
		// Register this bot with the API
		logger.capi(`Attempting to register ${client.user.username}...`);
		// Send registration data
		ws.send(JSON.stringify(data));
	});

	ws.on('message', (data) => {
		const msg = JSON.parse(data);
		logger.capi(msg.message);
	});

	ws.on('close', () => {
		logger.capi(`Connection lost for ${client.user.username}. Attempting to reconnect...`);
		setTimeout(() => subscribeToApi(client, apiWsUrl, data), 5000);
	});

	ws.on('error', (err) => {
		logger.capi(`an error occurred: ${err.message}`);
	});
	return ws;
}

module.exports = { subscribeToApi };
