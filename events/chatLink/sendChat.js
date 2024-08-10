const { Events } = require('discord.js');
const { loadAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.MessageCreate,
	runType: 'disabled',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;
		if (message.channel.id !== process.env.CHATLINK_CHANNEL) return;

		// Ports to send messages to
		const serverList = [
			{ port: 8083, name: 'vh3' },
		];

		// Send messages to servers
		for (const server of serverList) {
			const API = await loadAPI(server.port);
			await sendConsoleMessage(API, `say [D] <${message.member.displayName}> ${message.content}`);
		}
	},
};
