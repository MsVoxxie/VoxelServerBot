const ampAPI = require('@cubecoders/ampapi');
const Logger = require('../logging/logger');

// Load API for the main instance
async function mainAPI() {
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;
	const API = new ampAPI.AMPAPI(`${AMP_URI}`);
	try {
		let APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 1 API init Failed');
		const loginResult = await API.Core.LoginAsync(AMP_USER, AMP_PASS, '', false);
		if (!loginResult.success) return Logger.error('API Login Failed');
		API.sessionId = loginResult.sessionID;
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
		let APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 1 API init Failed');
		const loginResult = await API.Core.LoginAsync(AMP_USER, AMP_PASS, '', false);
		if (!loginResult.success) return Logger.error('API Login Failed');
		API.sessionId = loginResult.sessionID;
		APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 2 API init Failed');
		if (!API) throw new Error('Invalid API or the instance is offline.');
		return API;
	} catch (err) {
		if (client.debug) {
			console.error(err);
		}
	}
}

// Fetch the trigger id of a specified eventTrigger
async function fetchTriggerId(serverId, triggerDescription) {
	const API = await instanceAPI(serverId);
	const allTriggers = await API.Core.GetScheduleDataAsync();
	let filteredTrigger =
		allTriggers.AvailableTriggers.find((trigger) => trigger.Description === triggerDescription) ||
		allTriggers.PopulatedTriggers.find((trigger) => trigger.Description === triggerDescription);
	// Player sends a chat message is an outlying trigger that is not always available
	if (triggerDescription === 'A player sends a chat message' && !filteredTrigger) {
		filteredTrigger =
			allTriggers.AvailableTriggers.find((trigger) => trigger.Description === 'A user sends a chat message') ||
			allTriggers.PopulatedTriggers.find((trigger) => trigger.Description === 'A user sends a chat message');
	}
	if (!filteredTrigger) throw new Error(`No Trigger Found with the description: ${triggerDescription}`);
	return { Id: filteredTrigger.Id, Description: filteredTrigger.Description };
}

// Fetch the event name of a specified event
async function fetchTaskId(serverId, taskName) {
	const API = await instanceAPI(serverId);
	const allEvents = await API.Core.GetScheduleDataAsync();
	const filteredEvent = allEvents.AvailableMethods.find((event) => event.Name === taskName) || allEvents.PopulatedMethods.find((event) => event.Name === taskName);
	if (!filteredEvent) throw new Error(`No Event Found with the name: ${taskName}`);
	return { Id: filteredEvent.Id, Description: filteredEvent.Description };
}

// Fetch the trigger id of a specified eventTrigger
async function fetchTriggerTaskId(serverId, triggerDescription, taskName) {
	// Get the event id
	const API = await instanceAPI(serverId);
	const triggerId = await fetchTriggerId(serverId, triggerDescription);
	const taskId = await fetchTaskId(serverId, taskName);
	const allTriggers = await API.Core.GetScheduleDataAsync();

	// Get the trigger
	const fetchedTrigger = allTriggers.PopulatedTriggers.find((trigger) => trigger.Id === triggerId.Id);
	if (!fetchedTrigger) throw new Error(`No Trigger Found with the id: ${triggerId.Id}`);

	// Get the Task
	const fetchedTask = fetchedTrigger.Tasks.find((task) => task.TaskMethodName === taskId.Id);

	return {
		taskId: fetchedTask.Id,
		taskDescription: fetchedTask.TaskMethodName,
		triggerId: fetchedTrigger.Id,
		triggerDescription: fetchedTrigger.Description,
	};
}

// Send a console message to a specific instance
async function sendConsoleMessage(API, Message) {
	if (!API) throw new Error('No Valid API Instance Provided.');
	await API.Core.SendConsoleMessageAsync(Message);
}

module.exports = {
	mainAPI,
	instanceAPI,
	fetchTaskId,
	fetchTriggerId,
	fetchTriggerTaskId,
	sendConsoleMessage,
};
