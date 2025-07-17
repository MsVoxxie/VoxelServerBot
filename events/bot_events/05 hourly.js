const logger = require('../../functions/logging/logger');

module.exports = {
	name: 'hourly',
	runType: 'infinity',
	async execute(client) {
		// Reduce the crash counter for each instance by one until it reaches zero
		try {
			client.crashCount.forEach((count, instanceId) => {
				if (count > 0) {
					client.crashCount.set(instanceId, count - 1);
				}
			});
		} catch (error) {
			logger.error(`Error reducing crash count: ${error.message}`);
		}
	},
};
