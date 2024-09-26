const { updateDatabaseInstances } = require('../../functions/ampAPI/updateDatabase');
const logger = require('../../functions/logging/logger');

module.exports = {
	name: 'oneMinute',
	runType: 'infinity',
	async execute(client) {
		// Update the database with the instances
		const { instanceCount, allInstances } = await updateDatabaseInstances();
		const { totalInstances, oldInstances } = client;

		// Check if the instance count has changed and find any added instances
		const addedInstances = allInstances.filter((i) => !oldInstances.some((old) => old.instanceId === i.instanceId));

		// If there are added instances, log them
		if (addedInstances.length > 0) {
			addedInstances.forEach((i) => {
				// Emit an event for the added instance
				client.emit('serverInstanceCreated', i);
				logger.info(`Added instance: ${i.instanceName} (${i.instanceFriendlyName})`);
			});
		}

		// Check if the instance count has changed and find any removed instances
		const removedInstances = oldInstances.filter((i) => !allInstances.some((newI) => newI.instanceId === i.instanceId));

		// If there are removed instances, log them
		if (removedInstances.length > 0) {
			removedInstances.forEach((i) => {
				// Emit an event for the removed instance
				client.emit('serverInstanceDeleted', i);
				logger.info(`Removed instance: ${i.instanceName} (${i.instanceFriendlyName})`);
			});
		}

		// Update the client with the new instance count
		client.totalInstances = instanceCount;
		client.oldInstances = allInstances;
	},
};
