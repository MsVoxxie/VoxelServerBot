const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');

module.exports = {
	name: 'backupStarting',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, MESSAGE, INSTANCE);

		// Add the instanceid and startTime to the backupTimers collection
		if (!client.backupTimers.has(INSTANCE)) {
			client.backupTimers.set(INSTANCE, { startTime: Date.now() });
		}
	},
};
