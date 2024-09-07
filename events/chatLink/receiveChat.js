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
			const chatlinkFetch = await chatLink.find({ 'chatLinks.instanceId': INSTANCE }).lean();
			if (!chatlinkFetch.length) return;

			for (const chatLinkD of chatlinkFetch) {
				const chatLinkData = chatLinkD.chatLinks[0];
				if (chatLinkData.instanceModule === 'Minecraft') {
					userAvatar = `${chatLinkData.instanceName.includes(USER) ? '' : `https://mc-heads.net/head/${data.USER}`}`;
					// Create and Send
					const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
					webhook.send({
						username: USER,
						avatarURL: userAvatar || '',
						content: `${MESSAGE.replace(/^<@!?(\d+)>$/, 'MENTION')}`,
					});
				}
			}
		}
	},
};
