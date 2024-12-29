const { ampInstances } = require('../../models');
const { mainAPI } = require('./apiFunctions');
const { getConfigNode } = require('./instanceFunctions');
const { getImageSource } = require('../helpers/getSourceImage');

// Create a function that will update the database with the instances
async function updateDatabaseInstances() {
	const instancesArray = [];
	let gameVersion;
	let mcMotd;

	// Fetch all instances for AMP
	const API = await mainAPI();
	const instancesResult = await API.ADSModule.GetLocalInstancesAsync();

	for await (const i of instancesResult) {
		// If the instance is named ADS, skip it as it's the main instance
		if (i.InstanceName === 'ADS01') continue;

		// If the instance welcome message includes hidden, skip it
		if (i.WelcomeMessage?.includes('hidden')) continue;

		// Fetch the port from the API
		const instanceEndpoint = await API.ADSModule.GetApplicationEndpointsAsync(i.InstanceID);
		const applicationPort = instanceEndpoint[0].Endpoint.split(':')[1];

		// If the instance module is Minecraft, Try to determine the game version.
		if (i.Module === 'Minecraft' && i.Running) {
			// Get the game version
			const forgeVersion = await getConfigNode(i.InstanceID, 'MinecraftModule.Minecraft.SpecificForgeVersion');
			gameVersion = forgeVersion?.currentValue.split(' ')[2]?.replace(')', '').replace('(', '') || 'Unknown';
		}

		// Grab the instances banner image
		const bannerImage = await getImageSource(i.DisplayImageSource);

		// Create a friendly object
		const friendly = {
			instanceId: i.InstanceID,
			instanceRunning: i.Running,
			instanceModule: i.Module,
			instanceName: i.InstanceName,
			instanceFriendlyName: i.FriendlyName,
			instanceDisplaySource: bannerImage,
			instanceSuspended: i.Suspended,
			minecraftVersion: gameVersion,
			applicationPort,
		};

		// Return the friendly object
		instancesArray.push(friendly);
	}

	// Get current number of instances from the array
	const instanceCount = instancesArray.length;

	// Remove undefined from friendlyInstances array
	const friendlyInstances = instancesArray.filter((i) => i !== undefined).sort((a, b) => a.instancePort - b.instancePort);

	// Push to database
	await ampInstances.findOneAndUpdate({}, { instances: friendlyInstances }, { upsert: true }).catch((err) => console.error(err));
	// logger.info('Database updated with fresh instance data.');
	return { success: true, instanceCount, allInstances: friendlyInstances };
}

module.exports = { updateDatabaseInstances };
