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
			// Filter the chatLinks array in JavaScript to only return matching instanceIds
			const matchingChatLinks = chatlinkFetch.chatLinks.filter((link) => link.instanceId === INSTANCE);
			if (!matchingChatLinks.length) return;

			for (const chatLinkD of matchingChatLinks) {
				const chatLinkData = chatLinkD;

				// Check if the instance module is Minecraft
				if (chatLinkData.instanceModule === 'Minecraft') {
					userAvatar = `${chatLinkData.instanceName.includes(USER) ? '' : `https://mc-heads.net/head/${data.USER}`}`;
				}

				// Message to Send
				const message = `${MESSAGE.replace(/^<@!?(\d+)>$/, '<[MENTION REDACTED]>')}`;

				// Create and Send
				const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
				await webhook.send({
					username: `${USER} | ${chatLinkData.instanceFriendlyName}`,
					avatarURL: userAvatar,
					content: message,
				});
			}
		}
	},
};
