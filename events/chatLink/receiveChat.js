const { WebhookClient } = require('discord.js');
const { chatLink } = require('../../models');

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		// Check for Prestart
		if (data.MESSAGE === 'Server PreStart') return;

		// Send webhook
		await serverLink(data.USER, data.MESSAGE, data.INSTANCE);

		// Function for sanity
		async function serverLink(USER = 'Placeholder', MESSAGE = 'Placeholder', INSTANCE = 'Placeholder') {
			// Defintions
			let userAvatar = '';

			// Fetch the instance ID from the database
			const chatlinkFetch = await chatLink.findOne({ 'chatLinks.instanceId': INSTANCE }).lean();
			if (!chatlinkFetch) return;

			// Get the chat link data
			const chatLinkData = chatlinkFetch.chatLinks[0];

			console.log(USER, MESSAGE, INSTANCE);

			// Get Avatar
			if (chatLinkData.instanceModule === 'Minecraft') {
				userAvatar = `${blacklistedNames.includes(USER) ? '' : `https://mc-heads.net/head/${data.USER}`}`;
				// Create and Send
				const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
				webhook.send({
					username: USER,
					avatarURL: userAvatar || '',
					content: `${MESSAGE.replace(/^<@!?(\d+)>$/, 'MENTION')}`,
				});
			}
		}
	},
};

const blacklistedNames = ['SERVER', 'MC-ETERNAL', 'ATM9', 'STONEOPOLIS', 'LL7', 'CTE2', '7D2D | 1.0 Experimental', 'VoxelCORE'];
