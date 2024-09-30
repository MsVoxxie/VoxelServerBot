const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		// Check for Prestart and duplicate messages
		if (data.MESSAGE === 'Server PreStart') return;
		if (client.lastReceivedChat === data.MESSAGE) return;

		// Send webhook
		await serverLink(data.USER, data.MESSAGE, data.INSTANCE);
		client.lastReceivedChat = data.MESSAGE;
	},
};
