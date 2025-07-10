const ampAPI = require('@cubecoders/ampapi');
const Logger = require('../logging/logger');
let mainAPIInstance = null;
const instanceAPIInstances = {}; // Cache for instance APIs

async function createAMPAPI({ uri, user, pass }) {
	const API = new ampAPI.AMPAPI(uri);
	try {
		let APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 1 API init Failed');
		const loginResult = await API.Core.LoginAsync(user, pass, '', false);
		if (!loginResult.success) return Logger.error('API Login Failed');
		API.sessionId = loginResult.sessionID;
		APIInitOK = await API.initAsync();
		if (!APIInitOK) return Logger.error('Stage 2 API init Failed');
		return API;
	} catch (err) {
		return null;
	}
}

// Load API for the main instance
async function mainAPI() {
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;
	return createAMPAPI({ uri: AMP_URI, user: AMP_USER, pass: AMP_PASS });
}

async function getMainAPI() {
	if (mainAPIInstance) return mainAPIInstance;
	mainAPIInstance = await mainAPI();
	return mainAPIInstance;
}

// Load API for a specific instance
async function instanceAPI(instanceID) {
	const { AMP_URI, AMP_USER, AMP_PASS } = process.env;
	if (!instanceID) throw new Error('A valid InstanceID must be provided.');
	const uri = `${AMP_URI}/API/ADSModule/Servers/${instanceID}`;
	return createAMPAPI({ uri, user: AMP_USER, pass: AMP_PASS });
}

// Get the instance API, initializing it if not already done
async function getInstanceAPI(instanceID) {
	if (instanceAPIInstances[instanceID]) return instanceAPIInstances[instanceID];
	const api = await instanceAPI(instanceID);
	instanceAPIInstances[instanceID] = api;
	return api;
}

// Fetch the trigger id of a specified eventTrigger
async function fetchTriggerId(serverId, triggerDescription) {
	const API = await getInstanceAPI(serverId);
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
	const API = await getInstanceAPI(serverId);
	const allEvents = await API.Core.GetScheduleDataAsync();
	const filteredEvent = allEvents.AvailableMethods.find((event) => event.Name === taskName) || allEvents.PopulatedMethods.find((event) => event.Name === taskName);
	if (!filteredEvent) throw new Error(`No Event Found with the name: ${taskName}`);
	return { Id: filteredEvent.Id, Description: filteredEvent.Description };
}

// Fetch the trigger id of a specified eventTrigger
async function fetchTriggerTaskId(serverId, triggerDescription, taskName) {
	// Get the event id
	const API = await getInstanceAPI(serverId);
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

// Send a console message to a specific instance by ID
async function sendConsoleMessage(instanceID, Message) {
	if (!instanceID) throw new Error('No instance ID provided');
	if (!Message) throw new Error('No message provided');
	const API = await getInstanceAPI(instanceID);
	if (!API) throw new Error('No API instance available for the given ID');
	await API.Core.SendConsoleMessageAsync(Message);
}

module.exports = {
	mainAPI,
	getMainAPI,
	instanceAPI,
	getInstanceAPI,
	fetchTaskId,
	fetchTriggerId,
	fetchTriggerTaskId,
	sendConsoleMessage,
};
