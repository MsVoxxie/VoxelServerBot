const { Events } = require('discord.js');
const { loadAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.MessageCreate,
	runType: 'infinity',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;
		if (message.channel.id !== process.env.CHATLINK_CHANNEL) return;

		// Send it
		const API = await loadAPI(8089);
		await sendConsoleMessage(API, `say [D] <${message.member.displayName}> ${message.content}`);
	},
};
