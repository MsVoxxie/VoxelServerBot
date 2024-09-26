const { ampInstances } = require('../../models');
const logger = require('../logging/logger');
const { mainAPI } = require('./apiFunctions');

// Create a function that will update the database with the instances
async function updateDatabaseInstances() {
	const instancesArray = [];

	// Fetch all instances for AMP
	const API = await mainAPI();
	const instancesResult = await API.ADSModule.GetLocalInstancesAsync();

	for await (const i of instancesResult) {
		// If the instance is named ADS, skip it as it's the main instance
		if (i.InstanceName === 'ADS01') continue;

		// Fetch the port from the API
		const instanceEndpoint = await API.ADSModule.GetApplicationEndpointsAsync(i.InstanceID);
		const applicationPort = instanceEndpoint[0].Endpoint.split(':')[1];

		// Create a friendly object
		const friendly = {
			instanceId: i.InstanceID,
			instanceRunning: i.Running,
			instanceModule: i.Module,
			instanceName: i.InstanceName,
			instanceFriendlyName: i.FriendlyName,
			instanceSuspended: i.Suspended,
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
	logger.info('Database updated with fresh instance data.');
	return { success: true, instanceCount, allInstances: friendlyInstances };
}

module.exports = { updateDatabaseInstances };
