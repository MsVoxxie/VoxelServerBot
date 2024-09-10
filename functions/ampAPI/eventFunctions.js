const { instanceAPI } = require('./apiFunctions');

//* Add an event trigger to an instance
async function addEventTrigger(instanceId, triggerDescription) {
	// Get the instances API
	const API = await instanceAPI(instanceId);

	// Get all schedule data
	const scheduleData = await API.Core.GetScheduleDataAsync();
	// Fetch available triggers
	const fetchedTrigger = scheduleData.AvailableTriggers.filter((trigger) => trigger.Description === triggerDescription);
	if (!fetchedTrigger.length) return { desc: `No Trigger Found with the description: ${triggerDescription} Or it's already in use.`, success: false };

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
	if (!fetchedTrigger.length) return { desc: `No Trigger Found with the description: ${triggerDescription}.`, success: false };

	// Obtain the triggerId
	const [triggerId, triggerDesc] = [fetchedTrigger[0].Id, fetchedTrigger[0].Description];

	// Fetch available tasks
	const fetchedTask = scheduleData.AvailableMethods.filter((task) => task.Name === taskName);
	if (!fetchedTask.length) return { desc: `No Task Found with the name: ${taskName}.`, success: false };

	// Check if the task is already in the trigger
	const fetchedTaskInTrigger = fetchedTrigger[0].Tasks.find((task) => task.TaskMethodName === fetchedTask[0].Id);
	if (fetchedTaskInTrigger && !allowDuplicates) return { desc: `Task "${fetchedTask[0].Description}" is already in trigger "${triggerDesc}".`, success: false };

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

module.exports = {
	addEventTrigger,
	addTaskToTrigger,
	removeEventTrigger,
	removeTaskFromTrigger,
};
