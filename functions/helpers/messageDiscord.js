/**
 * Sends a message to a Discord webhook based on the provided user, message, instance, type and if it should be sent to both Discord and the server
 *
 * @param {string} [USER='Placeholder'] - The username of the sender. If 'SERVER', no avatar will be used
 * @param {string} [MESSAGE='Placeholder'] - The message content to be sent
 * @param {string} [INSTANCE='Placeholder'] - The instance ID to fetch the chat link from the database
 * @param {string} [TYPE= "Message", "Alert"] - The type of the message
 * @param {boolean} [DUAL=false] - If true, the message will be sent to both discord and server
 */
const { chatLink } = require('../../models');
const { WebhookClient } = require('discord.js');
const { getInstanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

// Function for sanity
async function serverLink(USER = 'Placeholder', UUID = null, MESSAGE = 'Placeholder', INSTANCE = 'Placeholder', TYPE = 'Message', DUAL = false) {
	let userAvatar = '';
	const chatlinkFetch = await chatLink.findOne({ 'chatLinks.instanceId': INSTANCE }).lean();
	const matchingChatLinks = chatlinkFetch.chatLinks.filter((link) => link.instanceId === INSTANCE);
	if (!matchingChatLinks.length) return console.log(`No chat link found for instance ${INSTANCE}. Please check the database.`);

	const sentMessages = [];

	for (const chatLinkD of matchingChatLinks) {
		const chatLinkData = chatLinkD;

		// Check if the instance module is Minecraft
		if (chatLinkData.instanceModule === 'Minecraft') {
			// If USER === 'SERVER' then ignore the avatar
			if (USER === 'SERVER') {
				userAvatar = '';
			} else {
				// Get the user avatar - URL encode the username to handle spaces
				userAvatar = `https://vsb.voxxie.me/v1/client/playerheads/${encodeURIComponent(USER)}`;
			}
		} else {
			// If USER === 'SERVER' then ignore the avatar
			if (USER === 'SERVER') {
				userAvatar = '';
			} else if (UUID) {
				// Get the user avatar - URL encode the username to handle spaces
				userAvatar = `https://vsb.voxxie.me/v1/client/steamheads/${encodeURIComponent(UUID.replace('Steam_', ''))}`;
			}
		}

		// Message to Send
		let message = `${MESSAGE.replace(/^<@!?(\d+)>$/, '<[MENTION REDACTED]>')}`;

		// Create and Send
		const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
		const sentMsg = await webhook.send({
			username: `${USER} | ${chatLinkData.instanceFriendlyName}`,
			avatarURL: userAvatar,
			content: message,
		});
		sentMessages.push({
			id: sentMsg.id,
			webhookId: chatLinkData.webhookId,
			webhookToken: chatLinkData.webhookToken,
		});

		if (DUAL) {
			// Send the message to the server
			if (chatLinkData.instanceModule === 'Minecraft') {
				await sendConsoleMessage(
					INSTANCE,
					`tellraw @a [{"text":""},{"text":"[S] ","color":"yellow","hoverEvent":{"action":"show_text","contents":[{"text":"Server Message","color":"yellow"}]}},{"text":"${MESSAGE}"}]`
				);

				// If the message is an alert, play a sound
				await alertSoundMC(INSTANCE, TYPE);
			} else {
				await sendConsoleMessage(INSTANCE, `say "[${TYPE}] <${USER}> ${MESSAGE}"`);
			}
		}
	}

	return sentMessages; // Array of {id, webhookId, webhookToken}
}

module.exports = {
	serverLink,
};

async function alertSoundMC(INSTANCE, type = 'notice' || 'alert') {
	// Randomized variance added to the pitch, max of 0.2 and min of 0.1
	const pitch = Math.random() * (0.2 - 0.1) + 0.1;

	switch (type) {
		case 'alert':
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 100));
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 250));
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1 + pitch} 0.25`);
			break;

		case 'notice':
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${2 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${2 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			await sendConsoleMessage(INSTANCE, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1.5 + pitch} 0.25`);

		default:
			return;
	}
}
