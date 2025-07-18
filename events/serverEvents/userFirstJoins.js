const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { sendToWeb } = require('../../functions/helpers/toWeb');

module.exports = {
	name: 'userFirstJoins',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, UUID, INSTANCE, MESSAGE } = data;

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, UUID ? UUID : null, MESSAGE, INSTANCE);
		try {
			sendToWeb(INSTANCE, USER, MESSAGE);
		} catch (error) {
			null;
		}
	},
};
