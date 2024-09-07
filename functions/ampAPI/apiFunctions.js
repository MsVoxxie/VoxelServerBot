const ampAPI = require('@cubecoders/ampapi');
const Logger = require('../logging/logger');

// Load API for the main instance
async function mainAPI() {
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;

	const API = new ampAPI.AMPAPI(`${AMP_URI}`);

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
		// Logger.success('AMP API Initialized');
		return API;
	} catch (err) {
		console.error(err);
	}
}

// Load API for a specific instance
async function instanceAPI(instanceID) {
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;

	if (!instanceID) throw new Error('A valid InstanceID must be provided.');
	const API = new ampAPI.AMPAPI(`${AMP_URI}/API/ADSModule/Servers/${instanceID}`);

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

// Send a console message to a specific instance
async function sendConsoleMessage(API, Message) {
	if (!API) throw new Error('No Valid API Instance Provided.');
	await API.Core.SendConsoleMessageAsync(Message);
}

module.exports = {
	mainAPI,
	instanceAPI,
	sendConsoleMessage,
};
