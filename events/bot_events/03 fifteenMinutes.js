const { ampInstances } = require('../../models');
const { mainAPI } = require('../../functions/ampAPI/apiFunctions');
const Logger = require('../../functions/logging/logger');

module.exports = {
	name: 'fifteenMinutes',
	runType: 'infinity',
	async execute(client) {
		// Fetch all instances for AMP
		const API = await mainAPI();
		const instancesResult = await API.ADSModule.GetLocalInstancesAsync();
		let friendlyInstances = instancesResult.map((i) => {
			// If the instance is named ADS, skip it as it's the main instance
			if (i.InstanceName === 'ADS01') return;

			// Create a friendly object
			const friendly = {
				instanceId: i.InstanceID,
				instanceRunning: i.Running,
				instanceModule: i.Module,
				instanceName: i.InstanceName,
				instanceFriendlyName: i.FriendlyName,
				instanceSuspended: i.Suspended,
				instancePort: i.Port,
			};

			// Return the friendly object
			return friendly;
		});

		// Remove undefined from friendlyInstances array
		friendlyInstances = friendlyInstances.filter((i) => i !== undefined).sort((a, b) => a.instancePort - b.instancePort);

		// Push to database
		await ampInstances.findOneAndUpdate({}, { instances: friendlyInstances }, { upsert: true });

		Logger.info('Updating instances.');
	},
};
