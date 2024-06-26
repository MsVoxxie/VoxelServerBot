const { WebhookClient } = require('discord.js');
const Logger = require('../../functions/logging/logger');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		// Check for Prestart
		if (data.MESSAGE === 'Server PreStart') return;

		// Send webhook
		Logger.info(data);
		await serverLink(data.USER, data.MESSAGE);

		// Function for sanity
		async function serverLink(USER = 'Placeholder', MESSAGE = 'Placeholder') {
			// Get Avatar
			const userAvatar = `${blacklistedNames.includes(USER) ? '' : `https://mc-heads.net/avatar/${data.USER}`}`;

			// Create and Send
			const webhook = new WebhookClient({ url: process.env.CHATLINK_WEBHOOK });
			webhook.send({
				username: USER,
				avatarURL: userAvatar,
				content: `${MESSAGE.replace(/^<@!?(\d+)>$/, 'MENTION')}`,
			});
		}
	},
};

const blacklistedNames = ['SERVER', 'MC-ETERNAL', 'ATM9', 'STONEOPOLIS'];
