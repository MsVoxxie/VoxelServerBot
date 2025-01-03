const { instanceAPI } = require('./apiFunctions');
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

//! Get a config node by its name
async function getConfigNode(instanceId, configNode) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Fetch the config node
	const configData = await API.Core.GetConfigAsync(configNode);

	return { node: configData.Node, currentValue: configData.CurrentValue };
}

//! Set a config node by its name
async function setConfigNode(instanceId, configNode, configValue) {
	// Get the instances API
	const API = await instanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Set the config node
	const configData = await API.Core.SetConfigAsync(configNode, configValue);

	return { success: configData.Status };
}

//! Get the current status of an instance
async function getInstanceStatus(instanceId) {
	// Get the instances API
	const API = await instanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Get the status of the instance
	const statusData = await API.Core.GetStatusAsync();

	// Get the instance module
	const instancesData = await ampInstances.findOne({ 'instances.instanceId': instanceId }).lean();

	// Performance is variable and can be FPS or TPS, so we need to check for both
	let performance = statusData.Metrics['TPS'] || statusData.Metrics['FPS'] || null;

	// If the module is Minecraft set the performance to TPS, otherwise set it to FPS
	if (performance) {
		performance.Unit = 'TPS';
	}

	// Make the status data more readable
	const status = {
		cpu: statusData.Metrics['CPU Usage'],
		memory: statusData.Metrics['Memory Usage'],
		users: statusData.Metrics['Active Users'],
		uptime: statusData.Uptime,
		performance,
	};

	return { status, success: true };
}

//! Get the currently online players of an instance
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

module.exports = {
	addEventTrigger,
	addTaskToTrigger,
	removeEventTrigger,
	removeTaskFromTrigger,
	getConfigNode,
	setConfigNode,
	getInstanceStatus,
	getOnlinePlayers,
};
