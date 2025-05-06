const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');

module.exports = {
	name: 'takeBackupComplete',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		let { USER, INSTANCE, MESSAGE } = data;

		// Modify the message to include the time taken
		const startTime = client.backupTimers.get(INSTANCE).startTime;
		const duration = client.getDuration(startTime, Date.now()).join(', ');
		MESSAGE = `${MESSAGE}\n Took ${duration}`;

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, MESSAGE, INSTANCE);

		// Remove the instanceid from the backupTimers collection
		if (client.backupTimers.has(INSTANCE)) {
			client.backupTimers.delete(INSTANCE);
		}
	},
};
