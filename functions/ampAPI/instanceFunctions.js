const { instanceAPI, mainAPI } = require('./apiFunctions');
const { ampInstances } = require('../../models');

//* Add an event trigger to an instance
async function addEventTrigger(instanceId, triggerDescription) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();
	// Fetch available triggers
	const fetchedTrigger = scheduleData.AvailableTriggers.filter((trigger) => trigger.Description === triggerDescription);

	if (!fetchedTrigger.length) return { desc: `No trigger found with the description: ${triggerDescription} Or it's already in use.`, success: false, exists: true };

	// Obtain the triggerId and triggerDescription
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Add the trigger to the instance
	await API.Core.AddEventTriggerAsync(triggerId);
	await API.Core.SetTriggerEnabledAsync(triggerId, true);

	// Return with success
	return { desc: `Added trigger "${triggerDesc}" to instance ${instanceId}.`, success: true };
}

//* Add a task to an event trigger
async function addTaskToTrigger(instanceId, triggerDescription, taskName, taskData, allowDuplicates = false) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();

	// Fetch populated triggers
	const fetchedTrigger = scheduleData.PopulatedTriggers.filter((trigger) => trigger.Description === triggerDescription);
	if (!fetchedTrigger.length) return { desc: `No trigger found with the description: ${triggerDescription}.`, success: false };

	// Obtain the triggerId
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Fetch available tasks
	const fetchedTask = scheduleData.AvailableMethods.filter((task) => task.Name === taskName);
	if (!fetchedTask.length) return { desc: `No Task Found with the name: ${taskName}.`, success: false };

	// Check if the task is already in the trigger
	const fetchedTaskInTrigger = fetchedTrigger[0].Tasks.find((task) => task.TaskMethodName === fetchedTask[0].Id);
	if (fetchedTaskInTrigger && !allowDuplicates) return { desc: `Task "${fetchedTask[0].Description}" is already in trigger "${triggerDesc}".`, success: false, exists: true };

	// Obtain the taskId
	const [taskId, taskDesc] = [fetchedTask[0].Id, fetchedTask[0].Description];

	// Add the task to the trigger
	await API.Core.AddTaskAsync(triggerId, taskId, taskData);

	// Return with success
	return { desc: `Added task "${taskDesc}" to trigger "${triggerDesc}" in instance ${instanceId}.`, success: true };
}

//* Change the order of tasks in an event trigger
async function changeTaskOrder(instanceId, triggerDescription, taskName, newOrder) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();
	// Fetch populated triggers
	const fetchedTrigger = scheduleData.PopulatedTriggers.filter((trigger) => trigger.Description === triggerDescription);
	if (!fetchedTrigger.length) return { desc: `No active trigger found with the description: ${triggerDescription}.`, success: false };

	// Obtain the triggerId
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Fetch available tasks
	const fetchedTask = scheduleData.AvailableMethods.filter((task) => task.Name === taskName);
	if (!fetchedTask.length) return { desc: `No active task found with the name: ${taskName}.`, success: false };

	// Get the trigger from the task
	const fetchedTaskInTrigger = fetchedTrigger[0].Tasks.find((task) => task.TaskMethodName === fetchedTask[0].Id);
	if (!fetchedTaskInTrigger) return { desc: `Task "${fetchedTask[0].Description}" is not in trigger "${triggerDesc}".`, success: false };

	// Obtain the taskId
	const [taskId, taskDesc] = [fetchedTaskInTrigger.Id, fetchedTask[0].Description];

	// Change the order of the task
	await API.Core.ChangeTaskOrderAsync(triggerId, taskId, newOrder);

	// Return with success
	return { desc: `Changed the order of task "${taskDesc}" in trigger "${triggerDesc}" to ${newOrder} in instance ${instanceId}.`, success: true };
}

//! Remove an event trigger from an instance
async function removeEventTrigger(instanceId, triggerDescription) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();
	// Fetch populated triggers
	const fetchedTrigger = scheduleData.PopulatedTriggers.filter((trigger) => trigger.Description === triggerDescription);
	if (!fetchedTrigger.length) return { desc: `No active trigger found with the description: ${triggerDescription}.`, success: false };

	// Obtain the triggerId
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Remove the trigger from the instance
	await API.Core.DeleteTriggerAsync(triggerId);

	// Return with success
	return { desc: `Removed trigger "${triggerDesc}" from instance ${instanceId}.`, success: true };
}

//! Remove a task from an event trigger
async function removeTaskFromTrigger(instanceId, triggerDescription, taskName) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();
	// Fetch populated triggers
	const fetchedTrigger = scheduleData.PopulatedTriggers.filter((trigger) => trigger.Description === triggerDescription);
	if (!fetchedTrigger.length) return { desc: `No active trigger found with the description: ${triggerDescription}.`, success: false };

	// Obtain the triggerId
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Fetch available tasks
	const fetchedTask = scheduleData.AvailableMethods.filter((task) => task.Name === taskName);
	if (!fetchedTask.length) return { desc: `No active task found with the name: ${taskName}.`, success: false };

	// Get the trigger from the task
	const fetchedTaskInTrigger = fetchedTrigger[0].Tasks.find((task) => task.TaskMethodName === fetchedTask[0].Id);
	if (!fetchedTaskInTrigger) return { desc: `Task "${fetchedTask[0].Description}" is not in trigger "${triggerDesc}".`, success: false };

	// Obtain the taskId
	const [taskId, taskDesc] = [fetchedTaskInTrigger.Id, fetchedTask[0].Description];

	// Remove the task from the trigger
	await API.Core.DeleteTaskAsync(triggerId, taskId);

	// Return with success
	return { desc: `Removed task "${taskDesc}" from trigger "${triggerDesc}" in instance ${instanceId}.`, success: true };
}

//* Get a config node by its name
async function getConfigNode(instanceId, configNode) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Fetch the config node
	const configData = await API.Core.GetConfigAsync(configNode);

	return { node: configData.Node, currentValue: configData.CurrentValue };
}

//* Set a config node by its name
async function setConfigNode(instanceId, configNode, configValue) {
	// Get the instances API
	const API = await instanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Set the config node
	const configData = await API.Core.SetConfigAsync(configNode, configValue);

	return { success: configData.Status };
}

//* Get the current status of an instance
async function getInstanceStatus(instanceId) {
	// Get the instances API
	const API = await instanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Get the status of the instance
	const statusData = await API.Core.GetStatusAsync();
	if (!statusData) return { desc: 'Failed to get status data.', success: false };

	// Get module info
	const moduleInfo = await API.Core.GetModuleInfoAsync();
	if (!moduleInfo) return { desc: 'Failed to get module info.', success: false };

	// Performance is variable and can be FPS or TPS, so we need to check for both
	let performance = statusData.Metrics['TPS'] || statusData.Metrics['FPS'] || null;

	// If the module is Minecraft set the performance to TPS, otherwise set it to FPS
	if (performance) {
		performance.Unit = 'TPS';
	}

	// Assign the numerical state as a string with an object
	const currentState = {
		0: 'Stopped',
		5: 'PreStart',
		7: 'Configuring',
		10: 'Starting',
		20: 'Running',
		30: 'Restarting',
		40: 'Stopping',
		45: 'PreparingForSleep',
		50: 'Sleeping',
		60: 'Waiting',
		70: 'Installing',
		75: 'Updating',
		80: 'AwaitingUserInput',
		100: 'Failed',
		200: 'Suspended',
		250: 'Maintainence',
		999: 'Indeterminate',
	};

	// Make the status data more readable
	const status = {
		state: currentState[statusData.State],
		module: moduleInfo.ModuleName,
		cpu: statusData.Metrics['CPU Usage'],
		memory: statusData.Metrics['Memory Usage'],
		users: statusData.Metrics['Active Users'],
		uptime: statusData.Uptime,
		performance,
	};

	return { status, success: true };
}

//* Get the currently online players of an instance
async function getOnlinePlayers(instanceId) {
	// Get the instances API
	const API = await instanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Get the online players
	const playersData = await API.Core.GetUserListAsync();

	// Map the players to an array
	const players = Object.entries(playersData).map(([uuid, name]) => ({ uuid, name }));

	return { players, success: true };
}

//* Get the status of every instance and it's server
async function fetchInstanceStatuses() {
	const instanceApi = await mainAPI();
	const instances = await instanceApi.ADSModule.GetLocalInstancesAsync();
	const dataArray = [];

	// Async loop through the instances
	for await (const i of instances) {
		// If the instance is named ADS, skip it as it's the main instance
		if (i.InstanceName === 'ADS01') continue;
		const instanceInfo = {
			instanceId: i.InstanceID,
			instanceName: i.InstanceName,
			instanceFriendlyName: i.FriendlyName,
			instanceRunning: i.Running,
			instanceSuspended: i.Suspended,
			instanceModule: i.Module,
		};

		// Get the server info
		const serverData = await getInstanceStatus(i.InstanceID);
		const serverInfo = {
			state: serverData?.status?.state || null,
			cpu: serverData?.status?.cpu || null,
			memory: serverData?.status?.memory || null,
			users: serverData?.status?.users || null,
			uptime: serverData?.status?.uptime || null,
			performance: serverData?.status?.performance || null,
		};

		// Combine the data for cleaner output
		const formattedOutput = {
			instanceInfo,
			serverInfo: Object.values(serverInfo).every((v) => v === null) ? { state: 'Offline' } : serverInfo,
		};

		dataArray.push(formattedOutput);
	}
	return { instances: dataArray, success: true };
}

module.exports = {
	addEventTrigger,
	addTaskToTrigger,
	changeTaskOrder,
	removeEventTrigger,
	removeTaskFromTrigger,
	getConfigNode,
	setConfigNode,
	getInstanceStatus,
	getOnlinePlayers,
	fetchInstanceStatuses,
};
