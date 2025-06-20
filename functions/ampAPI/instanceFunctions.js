const { getInstanceAPI, getMainAPI, sendConsoleMessage } = require('./apiFunctions');
const { getImageSource } = require('../helpers/getSourceImage');
const { chatLink } = require('../../models');
const Logger = require('../logging/logger');

const { SERVER_IP } = process.env;
const sevenDaysCache = {};

//* Add an event trigger to an instance
async function addEventTrigger(instanceId, triggerDescription) {
	// Get the instances API
	const API = await getInstanceAPI(instanceId);

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
	const API = await getInstanceAPI(instanceId);

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
	const API = await getInstanceAPI(instanceId);

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
	const API = await getInstanceAPI(instanceId);

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
	const API = await getInstanceAPI(instanceId);

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
	const API = await getInstanceAPI(instanceId);

	// Fetch the config node
	if (!API) return { desc: 'Invalid instanceId.', success: false };
	const configData = await API.Core.GetConfigAsync(configNode);

	return { node: configData.Node, currentValue: configData.CurrentValue };
}

//* Set a config node by its name
async function setConfigNode(instanceId, configNode, configValue) {
	// Get the instances API
	const API = await getInstanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Set the config node
	const configData = await API.Core.SetConfigAsync(configNode, configValue);

	return { success: configData.Status };
}

//* Get the current status of an instance
async function getInstanceStatus(instanceId) {
	// Get the instances API
	const API = await getInstanceAPI(instanceId);
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
	const API = await getInstanceAPI(instanceId);
	if (!API) return { desc: 'Invalid instanceId.', success: false };

	// Get the online players
	const playersData = await API.Core.GetUserListAsync();

	// Map the players to an array
	const players = Object.entries(playersData).map(([uuid, name]) => ({ uuid, name }));

	return { players, success: true };
}

//* Get the status of every instance and it's server
async function fetchInstanceStatuses() {
	const instanceApi = await getMainAPI();
	const instances = await instanceApi.ADSModule.GetLocalInstancesAsync();
	const filteredInstances = instances.filter((i) => i.InstanceName !== 'ADS01');

	// Fetch all instance statuses in parallel
	const instanceStatusPromises = filteredInstances.map((i) => getInstanceStatus(i.InstanceID));
	const instanceStatuses = await Promise.all(instanceStatusPromises);

	// Construct response
	const dataArray = filteredInstances.map((i, index) => {
		const serverData = instanceStatuses[index];
		return {
			instanceInfo: {
				instanceId: i.InstanceID,
				instanceName: i.InstanceName,
				instanceFriendlyName: i.FriendlyName,
				instanceRunning: i.Running,
				instanceDisplaySource: i.DisplayImageSource,
				instanceSuspended: i.Suspended,
				instanceModule: i.Module,
				instanceModuleName: i.ModuleDisplayName,
			},
			serverInfo: serverData?.status
				? {
						state: serverData.status.state,
						cpu: serverData.status.cpu,
						memory: serverData.status.memory,
						users: serverData.status.users,
						uptime: serverData.status.uptime,
						performance: serverData.status.performance,
				  }
				: { state: 'Offline' },
		};
	});

	return { instances: dataArray, success: true };
}

//* Get the status page data for all instances
async function getStatusPageData() {
	const instanceApi = await getMainAPI();
	if (!instanceApi) {
		return { instances: [], success: false };
	}

	try {
		const instances = await instanceApi.ADSModule.GetLocalInstancesAsync();

		const filteredInstances = instances.filter(
			(i) => i.InstanceName !== 'ADS01' && !(typeof i.WelcomeMessage === 'string' && i.WelcomeMessage.trim().toLowerCase() === 'hidden') && i.Running === true
		);

		if (filteredInstances.length === 0) {
			Logger.warn('No valid instances found');
			return { instances: [], success: true };
		}

		const instanceStatuses = await Promise.all(filteredInstances.map((i) => getInstanceStatus(i.InstanceID)));
		const instancePlayers = await Promise.all(filteredInstances.map((i) => getOnlinePlayers(i.InstanceID)));

		const dataArray = await Promise.all(
			filteredInstances.map(async (i, index) => {
				const serverData = instanceStatuses[index];
				const playersData = instancePlayers[index];
				const icon = (await getImageSource(i.DisplayImageSource)) || null;

				// Check if the instance has a bound chat-link
				const chatLink = await getChatLinkByInstanceId(i.InstanceID);
				const addedEvents = chatLink?.addedEvents || [];
				const hasChatEvent = addedEvents.includes('A player sends a chat message') || addedEvents.includes('A user sends a chat message');

				i.linkStatus = !!chatLink && hasChatEvent;

				// If the Description contains a date, extract it as a releaseDate and remove it from the description
				let releaseDate = null;
				const dateMatch = i.Description ? i.Description.match(/<t:(\d+)>/) : null;
				if (dateMatch) {
					releaseDate = new Date(parseInt(dateMatch[1], 10) * 1000).toISOString();
					i.Description = i.Description.replace(dateMatch[0], '').trim();
				}

				// If the instance module is Minecraft, get the motd and extract the pack version
				let pack_version = null;
				if (i.Module === 'Minecraft') {
					const motdData = (await getConfigNode(i.InstanceID, 'MinecraftModule.Minecraft.ServerMOTD')) || null;
					if (motdData) {
						pack_version = motdData.currentValue;
					}
				}

				let currentTime = null;

				// If the instance module is Seven Days To Die, get the currentTime
				if (i.ModuleDisplayName === 'Seven Days To Die') {
					const cache = sevenDaysCache[i.InstanceID] || {};
					const now = Date.now();

					if (!cache.timestamp || now - cache.timestamp > 1 * 60 * 1000) {
						try {
							const sevenAPI = await getInstanceAPI(i.InstanceID);
							await sendConsoleMessage(i.InstanceID, 'gettime');
							await sevenAPI.Core.GetUpdatesAsync();
							await new Promise((resolve) => setTimeout(resolve, 500));
							const consoleResponse = await sevenAPI.Core.GetUpdatesAsync();
							const consoleOutput = consoleResponse.ConsoleEntries;

							const dayEntry = consoleOutput.find((ent) => typeof ent.Contents === 'string' && /^Day \d+, \d{2}:\d{2}/.test(ent.Contents));
							if (dayEntry) {
								const match = dayEntry.Contents.match(/^Day (\d+), (\d{2}:\d{2})/);
								if (match) {
									currentTime = { day: match[1], time: match[2] };
									// Only update cache if we have valid data
									sevenDaysCache[i.InstanceID] = {
										timestamp: now,
										currentTime,
									};
								}
							}
							// If no valid data, do NOT update the cache (keep previous value)
						} catch (err) {
							// Optionally log error, but do NOT update the cache
						}
					}
					currentTime = sevenDaysCache[i.InstanceID]?.currentTime ?? null;
				}

				// Pluck the server port from the instance
				const mainPort = extractMainPort(i.DeploymentArgs);

				return {
					instanceId: i.InstanceID,
					instanceName: i.InstanceName,
					friendlyName: i.FriendlyName,
					welcomeMessage: i.WelcomeMessage,
					description: i.Description,
					releaseDate,
					running: i.Running,
					module: i.Module,
					moduleName: i.ModuleDisplayName,
					pack_version,
					icon,
					suspended: i.Suspended,
					server: safeServer(serverData, mainPort, SERVER_IP, currentTime),
					players: playersData?.players ?? [],
					linkStatus: i.linkStatus,
				};
			})
		);

		// Sort instances by module, online status, and then by instance name
		// Online status is in the order of Running Starting Updating Prestart Stopping Stopped Failed Offline
		const statusOrder = ['Running', 'Starting', 'Updating', 'PreStart', 'Stopping', 'Stopped', 'Failed', 'Offline'];

		dataArray.sort((a, b) => {
			const stateA = a.server?.state || 'Offline';
			const stateB = b.server?.state || 'Offline';
			const stateIndexA = statusOrder.indexOf(stateA);
			const stateIndexB = statusOrder.indexOf(stateB);

			if (stateIndexA !== stateIndexB) return stateIndexA - stateIndexB;

			const modulePriority = (mod) => (mod === 'Minecraft' ? 0 : 1);
			const priorityA = modulePriority(a.module || '');
			const priorityB = modulePriority(b.module || '');
			if (priorityA !== priorityB) return priorityA - priorityB;

			const moduleA = a.module || '';
			const moduleB = b.module || '';
			if (moduleA < moduleB) return -1;
			if (moduleA > moduleB) return 1;

			return a.instanceName.localeCompare(b.instanceName);
		});

		return { instances: dataArray, success: true };
	} catch (err) {
		Logger.error('Error building AMP status page data');
		Logger.error(err);
		return { instances: [], success: false };
	}
	function extractMainPort(deploymentArgs) {
		if (!deploymentArgs) return null;

		const mcPort = deploymentArgs['MinecraftModule.Minecraft.PortNumber'];
		if (mcPort) {
			return parseInt(mcPort, 10);
		}

		const rawPorts = deploymentArgs['GenericModule.App.Ports'];
		if (rawPorts) {
			try {
				const ports = JSON.parse(rawPorts);
				const primary = ports.find((p) => p.Ref === 'ServerPort') || ports[0];
				return primary?.Port || null;
			} catch (err) {
				console.error('Failed to parse ports:', err);
				return null;
			}
		}

		return null; // fallback
	}
}

function safeMetric(metric, defaults = {}) {
	return {
		RawValue: metric?.RawValue ?? defaults.RawValue ?? 0,
		MaxValue: metric?.MaxValue ?? defaults.MaxValue ?? 100,
		Percent: metric?.Percent ?? defaults.Percent ?? 0,
		Units: metric?.Units ?? defaults.Units ?? '',
		Color: metric?.Color ?? defaults.Color ?? '#888',
		Color2: metric?.Color2 ?? defaults.Color2 ?? '#888',
		Color3: metric?.Color3 ?? defaults.Color3 ?? '#FFF',
		ShortName: metric?.ShortName ?? defaults.ShortName ?? '',
	};
}

function safePerformance(perf, defaults = {}) {
	return {
		RawValue: perf?.RawValue ?? 0,
		MaxValue: perf?.MaxValue ?? 20,
		Percent: perf?.Percent ?? 0,
		Units: perf?.Units ?? 'TPS',
		Color: perf?.Color ?? '#888',
		Color2: perf?.Color2 ?? '#888',
		Color3: perf?.Color3 ?? '#FFF',
		ShortName: perf?.ShortName ?? '',
		Unit: perf?.Unit ?? 'TPS',
	};
}

function safeServer(serverData, mainPort, SERVER_IP, currentTime) {
	return {
		state: serverData?.status?.state ?? 'Offline',
		cpu: safeMetric(serverData?.status?.cpu),
		memory: safeMetric(serverData?.status?.memory),
		users: safeMetric(serverData?.status?.users, { RawValue: 0, MaxValue: 10, Percent: 0 }),
		uptime: serverData?.status?.uptime ?? '0:00:00:00',
		performance: safePerformance(serverData?.status?.performance),
		currentTime,
		ip: SERVER_IP ?? '',
		port: mainPort ?? null,
	};
}

async function getChatLinkByInstanceId(instanceId) {
	if (!instanceId) return null;
	const doc = await chatLink.findOne({ chatLinks: { $elemMatch: { instanceId: instanceId } } });
	if (!doc) return null;
	return doc.chatLinks.find((link) => link.instanceId === instanceId) || null;
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
	getStatusPageData,
};
