const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		let message = data.MESSAGE;

		// If the USER is SERVER and the MESSAGE is Ready, Let's get the time it took to start the server
		if (data.USER === 'SERVER' && data.MESSAGE === 'Ready') {
			const serverStart = client.serverStartTime(data.START);
			message = `Ready, took ${serverStart}`;
		}

		// Send webhook
		await serverLink(data.USER, message, data.INSTANCE);
	},
};
