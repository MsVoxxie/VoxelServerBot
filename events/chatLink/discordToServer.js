const { Events } = require('discord.js');
const { chatLink } = require('../../models');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.MessageCreate,
	runType: 'infinity',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;

		// Fetch all matching chat links
		const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': message.channel.id }).lean();
		// const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': message.channel.id }).lean();
		if (!chatlinkFetch.length) return;

		for (const chatLinkD of chatlinkFetch[0].chatLinks) {
			const chatLinkData = chatLinkD;

			// Check if the channel id matches the chat link channel id
			if (chatLinkData.channelId !== message.channel.id) continue;

			// Check if the instance module is Minecraft
			if (chatLinkData.instanceModule === 'Minecraft') {
				// Send messages to server
				const API = await instanceAPI(chatLinkData.instanceId);
				await sendConsoleMessage(API, `tellraw @a ["",{"text":"[D]","color":"blue"},"<${message.member.displayName}> ${message.content}"]`);
			} else {
				// Send messages to server
				const API = await instanceAPI(chatLinkData.instanceId);
				await sendConsoleMessage(API, `say [D] <${message.member.displayName}> ${message.content}`);
			}
		}
	},
};
