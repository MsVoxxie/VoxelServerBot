const { Events } = require('discord.js');
const { chatLink } = require('../../models');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { updateTypingScoreboard } = require('../../functions/serverFuncs/minecraft');

module.exports = {
	name: Events.TypingStart,
	runType: 'infinity',
	async execute(client, typing) {
		// Fetch all matching chat links
		const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': typing.channel.id }).lean();
		// const chatlinkFetch = await chatLink.find({ 'chatLinks.channelId': message.channel.id }).lean();
		if (!chatlinkFetch.length) return;

		for (const chatLinkD of chatlinkFetch[0].chatLinks) {
			const chatLinkData = chatLinkD;

			// Check if the channel id matches the chat link channel id and the instance module is Minecraft
			if (chatLinkData.channelId !== typing.channel.id) continue;
			if (chatLinkData.instanceModule !== 'Minecraft') continue;

			// Get the instance API
			const API = await instanceAPI(chatLinkData.instanceId);

			// Create a key for the typing state
			const key = `${typing.channel.id}_${typing.user.id}`;

			// Clear any existing timeout
			if (client.typingState.has(key)) {
				clearTimeout(client.typingState.get(key).timeout);
			}

			// Set a new timeout to remove after 10 seconds of inactivity
			const timeout = setTimeout(async () => {
				client.typingState.delete(key);
				await updateTypingScoreboard(typing.channel, client, sendConsoleMessage, API).catch(console.error);
			}, 30 * 1000);

			// Store or refresh the entry
			client.typingState.set(key, {
				user: typing.user,
				channel: typing.channel,
				timeout,
			});

			// Update the scoreboard with the typing users
			await updateTypingScoreboard(typing.channel, client, sendConsoleMessage, API);
		}
	},
};
