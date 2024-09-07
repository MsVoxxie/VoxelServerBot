const { Events } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.MessageCreate,
	runType: 'infinity',
	async execute(client, message) {
		if (message.author.bot) return;
		if (!message.content) return;
		if (message.channel.id !== process.env.CHATLINK_CHANNEL) return;

		// Ports to send messages to
		const serverList = [{ ID: '8be4a730-3d0d-499c-9ca4-cad9b355f65f', name: 'projectarchitect2' }];

		// Send messages to servers
		for (const server of serverList) {
			const API = await instanceAPI(server.ID);
			await sendConsoleMessage(API, `tellraw @p ["",{"text":"[D]","color":"blue"},"<${message.member.displayName}> ${message.content}"]`);
		}
	},
};
