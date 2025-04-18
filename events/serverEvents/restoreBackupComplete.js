const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'restoreBackupComplete',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Send off the message to Discord
		await serverLink(USER, MESSAGE, INSTANCE);
	},
};
