const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { alertSoundMC } = require('../../functions/helpers/messageFuncs');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { chatLink } = require('../../models');

module.exports = {
	name: 'networkNotice',
	runType: 'infinity',
	async execute(client, data) {
		const { type, message, details } = data;
		const { server, external } = details;

		// Fetch all matching chat links
		const chatlinkFetch = await chatLink.find({}).lean();
		if (!chatlinkFetch.length) return;

		// Get all valid chat links
		for (const chatLinkD of chatlinkFetch[0].chatLinks) {
			const chatLinkData = chatLinkD;
			const INSTANCE = chatLinkData.instanceId;
			const MODULE = chatLinkData.instanceModule;

			// Discord Messages
			try {
				// Define the message to send
				let discordMessage = `${message} \n\`\`\`Ping ${external} ${server}\`\`\``;

				// Send off the message to Discord
				queueTask(INSTANCE, serverLink, 'SERVER', discordMessage, INSTANCE);
			} catch (error) {
				console.error(`Error sending network notice to ${INSTANCE}:`, error);
			}

			// Server Messages
			try {
				const API = await instanceAPI(INSTANCE);
				let serverMessage = `${message} | Ping ${external} ${server}`;

				// Determine the color and hover text based on the type of network notice
				switch (MODULE) {
					case 'Minecraft':
						let color, hoverText, alertType;
						switch (type) {
							case 'External Congestion':
								color = 'red';
								alertType = 'alert';
								hoverText = 'Alert';
								break;
							case 'Server Congestion':
								color = 'orange';
								alertType = 'alert';
								hoverText = 'Alert';
								break;
							case 'Network Failure':
								color = 'dark_red';
								alertType = 'alert';
								hoverText = 'Alert';
								serverMessage = `Network Failed to respond.`;
								break;
							case 'Network Stable':
								color = 'green';
								hoverText = 'Notice';
								alertType = 'notice';
								break;
						}

						// Send the message to the server
						queueTask(
							INSTANCE,
							sendConsoleMessage,
							API,
							`tellraw @a [{"text":""},{"text":"[${hoverText}] ","color":"${color}","hoverEvent":{"action":"show_text","contents":[{"text":"Server","color":"${color}"}]}},{"text":"${serverMessage}"}]`
						);
						// Play an alert sound
						queueTask(INSTANCE, alertSoundMC, API, alertType);
						break;
					default:
						// For other modules we can just use say
						queueTask(INSTANCE, sendConsoleMessage, API, `say "${serverMessage}"`);
						break;
				}
			} catch (error) {
				console.error(`Error sending network notice to ${INSTANCE}:`, error);
			}
		}
	},
};
