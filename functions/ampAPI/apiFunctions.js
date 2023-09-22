async function loadAPI(Port) {
	const ampAPI = require('@cubecoders/ampapi');
	const Logger = require('../logging/logger');
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;

	if (!Port) throw new Error('A Port number Must be provided.');
	const API = new ampAPI.AMPAPI(`${AMP_URI}:${Port}`);

	try {
		// Stage One
		let APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 1 API init Failed');

		// Get Credentials
		const loginResult = await API.Core.LoginAsync(AMP_USER, AMP_PASS, '', false);
		if (!loginResult.success) return Logger.error('API Login Failed');

		// Set SessionID
		API.sessionId = loginResult.sessionID;

		// Stage Two
		APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 2 API init Failed');
		Logger.success('AMP API Initialized');
		return API;
	} catch (err) {
		console.error(err);
	}
}

async function sendConsoleMessage(API, Message) {
	if (!API) throw new Error('No Valid API Instance Provided.');
	await API.Core.SendConsoleMessageAsync(Message);
}

module.exports = {
	loadAPI,
	sendConsoleMessage,
};
