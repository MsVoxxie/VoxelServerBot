const { Events } = require('discord.js');
const { chatLink } = require('../../models');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { splitSentence } = require('../../functions/helpers/messageFuncs');

module.exports = {
	name: Events.MessageCreate,
	runType: 'infinity',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;

		// funny
		let shouldItalic = false;
		if (message.author.id === '151636912602480640') shouldItalic = true;

		// Fetch all matching chat links
		const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': message.channel.id }).lean();
		// const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': message.channel.id }).lean();
		if (!chatlinkFetch.length) return;

		// Split the message into parts if it exceeds the max length
		const messageParts = splitSentence(message.content, 200);
		let counter = ' ';

		for (const chatLinkD of chatlinkFetch[0].chatLinks) {
			const chatLinkData = chatLinkD;

			// Check if the channel id matches the chat link channel id
			if (chatLinkData.channelId !== message.channel.id) continue;

			// Get the message authors name and top-most role color
			const authorName = message.member.displayName;
			const authorColor = message.member.displayHexColor;

			// Check if the instance module is Minecraft
			if (chatLinkData.instanceModule === 'Minecraft') {
				try {
					for (let i = 0; i < messageParts.length; i++) {
						// only add the count if there are more than 1 message parts
						if (messageParts.length > 1) counter = ` (${i + 1}/${messageParts.length}) `;

						// Store formatted message for shorter code
						// const counterMessage = `<${message.member.displayName}>${counter}${messageParts[i]}`;
						const counterMessage = `${counter}${messageParts[i]}`;

						// Send each part of the message
						const API = await instanceAPI(chatLinkData.instanceId);
						await sendConsoleMessage(
							API,
							`tellraw @a ["",{"text":"[D] ","color":"blue","hoverEvent":{"action":"show_text","contents":[{"text":"Discord","color":"blue"}]}},{"text":"<"},{"text":"${authorName}","color":"${authorColor}"},{"text":">"},{"text":"${counterMessage}","italic":${shouldItalic}}]`
						);

						// Play a sound to get the attention of the players but randomize the pitch with a minimum of 0.8 and a maximum of 1.3
						const pitch = Math.random() * (1.3 - 0.8) + 0.8;
						await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${pitch} 0.25`);
					}
				} catch (error) {
					continue;
				}
			} else {
				try {
					// only add the count if there are more than 1 message parts
					if (messageParts.length > 1) counter = `(${i + 1}/${messageParts.length})`;

					// Send each part of the message
					for (let i = 0; i < messageParts.length; i++) {
						const API = await instanceAPI(chatLinkData.instanceId);
						await sendConsoleMessage(API, `say "[D] <${message.member.displayName}>${counter}${messageParts[i]}"`);
					}
				} catch (error) {
					continue;
				}
			}
		}
	},
};
