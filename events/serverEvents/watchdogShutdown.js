const { handleCrashCounter } = require('../../functions/helpers/messageFuncs');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');

module.exports = {
	name: 'watchdogShutdown',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;
		augmentedMessage = handleCrashCounter(client, INSTANCE, MESSAGE);

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, null, augmentedMessage, INSTANCE);
	},
};
