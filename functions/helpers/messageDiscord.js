const { WebhookClient } = require('discord.js');
const { chatLink } = require('../../models');

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
			// If USER === 'SERVER' then ignore the avatar
			if (USER === 'SERVER') {
				userAvatar = '';
			} else {
				// Get the user avatar
				userAvatar = `https://mc-heads.net/head/${USER}`;
			}
		}

		// Message to Send
		let message = `${MESSAGE.replace(/^<@!?(\d+)>$/, '<[MENTION REDACTED]>')}`;
		if (USER !== 'MinecraftPro87') {
			message = MESSAGE.replace(/#/, '## [Q]');
		}

		// Create and Send
		const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
		await webhook.send({
			username: `${USER} | ${chatLinkData.instanceFriendlyName}`,
			avatarURL: userAvatar,
			content: message,
		});
	}
}

module.exports = {
	serverLink,
};
