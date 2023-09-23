const { WebhookClient } = require('discord.js');
const Logger = require('../../functions/logging/logger');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		Logger.info(data);

		// Send webhook
		await serverLink(data.USER, data.MESSAGE);

		// Function for sanity
		async function serverLink(USER = 'Placeholder', MESSAGE = 'Placeholder') {
			const webhook = new WebhookClient({ url: process.env.CHATLINK_WEBHOOK });
			webhook.send({ content: `<${USER}> ${MESSAGE.replace(/^<@!?(\d+)>$/, 'MENTION')}` });
		}
	},
};
