const { getInstanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { alertSoundMC } = require('../../functions/helpers/messageFuncs');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { chatLink } = require('../../models');
const { codeBlock } = require('discord.js');

module.exports = {
	name: 'networkNotice',
	runType: 'infinity',
	async execute(client, data) {
		const { type, message, details } = data;
		const { server, external } = details;

		const { discordMessage, serverMessage } = getMessagesForType(type, message, server, external);

		const chatLinksData = await chatLink.find({}).lean();
		if (!chatLinksData.length) return;

		const chatLinks = chatLinksData[0].chatLinks;

		for (const { instanceId, instanceModule } of chatLinks) {
			try {
				// Send to Discord
				queueTask(instanceId, serverLink, 'SERVER', discordMessage, instanceId);

				if (instanceModule === 'Minecraft') {
					const { color, hoverText, alertType } = getMCAlertStyle(type);

					const tellraw = `tellraw @a [{"text":""},{"text":"[${hoverText}] ","color":"${color}","hoverEvent":{"action":"show_text","contents":[{"text":"Server","color":"${color}"}]}},{"text":"${serverMessage}"}]`;

					queueTask(instanceId, sendConsoleMessage, instanceId, tellraw);
					queueTask(instanceId, alertSoundMC, instanceId, alertType);
				} else {
					// Fallback for non-Minecraft modules
					queueTask(instanceId, sendConsoleMessage, instanceId, `say "${serverMessage}"`);
				}
			} catch (err) {
				console.error(`Error sending network notice to ${instanceId}:`, err);
			}
		}
	},
};

function getMessagesForType(type, message, server, external) {
	switch (type) {
		case 'External Congestion':
			return {
				serverMessage: `${message} | Ping ${external}`,
				discordMessage: `${message}\n${codeBlock('ml', `Ping ${external}`)}`,
			};
		case 'Server Congestion':
			return {
				serverMessage: `${message} | Server ${server}`,
				discordMessage: `${message}\n${codeBlock('ml', `Server ${server}`)}`,
			};
		case 'Network Failure':
			return {
				serverMessage: `${message} | Unable to reach external services`,
				discordMessage: `${message}\n${codeBlock('ml', 'Unable to reach external services')}`,
			};
		case 'Network Stable':
			return {
				serverMessage: `${message} | Ping ${external}`,
				discordMessage: `${message}\n${codeBlock('ml', `Ping ${external}`)}`,
			};
		default:
			return {
				serverMessage: message,
				discordMessage: codeBlock('ml', message),
			};
	}
}

function getMCAlertStyle(type) {
	switch (type) {
		case 'External Congestion':
		case 'Server Congestion':
		case 'Network Failure':
			return {
				color: type === 'Network Failure' ? 'dark_red' : type === 'Server Congestion' ? 'orange' : 'red',
				hoverText: 'Alert',
				alertType: 'alert',
			};
		case 'Network Stable':
		default:
			return {
				color: 'green',
				hoverText: 'Notice',
				alertType: 'notice',
			};
	}
}
