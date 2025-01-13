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
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

// Function for sanity
async function serverLink(USER = 'Placeholder', MESSAGE = 'Placeholder', INSTANCE = 'Placeholder', TYPE = 'Message', DUAL = false) {
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
			message = MESSAGE.replace(/#/, '## [Q] ');
		}

		// Create and Send
		const webhook = new WebhookClient({ id: chatLinkData.webhookId, token: chatLinkData.webhookToken });
		await webhook.send({
			username: `${USER} | ${chatLinkData.instanceFriendlyName}`,
			avatarURL: userAvatar,
			content: message,
		});

		if (DUAL) {
			// Fetch the instance API
			const API = await instanceAPI(INSTANCE);

			// Send the message to the server
			if (chatLinkData.instanceModule === 'Minecraft') {
				await sendConsoleMessage(
					API,
					`tellraw @a [{"text":""},{"text":"[S] ","color":"yellow","hoverEvent":{"action":"show_text","contents":[{"text":"Server Message","color":"yellow"}]}},{"text":"${MESSAGE}"}]`
				);

				// If the message is an alert, play a sound
				if (TYPE === 'Alert') await alertSoundMC(API);
			} else {
				await sendConsoleMessage(API, `say "[${TYPE}] <${USER}> ${MESSAGE}"`);
			}
		}
	}
}

module.exports = {
	serverLink,
};

async function alertSoundMC(API) {
	// Randomized variance added to the pitch, max of 0.2 and min of 0.1
	const pitch = Math.random() * (0.2 - 0.1) + 0.1;
	await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
	await new Promise((resolve) => setTimeout(resolve, 100));
	await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
	await new Promise((resolve) => setTimeout(resolve, 250));
	await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1 + pitch} 0.25`);
}
