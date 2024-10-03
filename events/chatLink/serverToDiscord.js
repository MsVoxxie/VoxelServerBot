const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		// Send webhook
		await serverLink(data.USER, data.MESSAGE, data.INSTANCE);
	},
};
