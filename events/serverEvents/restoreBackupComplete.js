const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');

module.exports = {
	name: 'restoreBackupComplete',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, null, MESSAGE, INSTANCE);
	},
};
