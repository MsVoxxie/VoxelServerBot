const { Events } = require('discord.js');
const { chatLink } = require('../../models');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.MessageCreate,
	runType: 'infinity',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;

		// Fetch the chat link data
		const chatlinkFetch = await chatLink.findOne({ 'chatLinks.channelId': message.channel.id }).lean();
		if (!chatlinkFetch) return;

		// Get the chat link data
		const chatLinkData = chatlinkFetch.chatLinks[0];

		// Check if the channel id matches the chat link channel id
		if (chatLinkData.channelId !== message.channel.id) return;

		// Check if the instance module is Minecraft
		if (chatLinkData.instanceModule == 'Minecraft') {
			// Send messages to server
			const API = await instanceAPI(chatLinkData.instanceId);
			await sendConsoleMessage(API, `tellraw @p ["",{"text":"[D]","color":"blue"},"<${message.member.displayName}> ${message.content}"]`);
		}
	},
};
