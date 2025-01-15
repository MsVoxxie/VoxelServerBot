const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { alertSoundMC } = require('../../functions/helpers/messageFuncs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Execute a method on the specified server')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((c) =>
			c
				.setName('start')
				.setDescription('Start the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('stop')
				.setDescription('Stop the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('restart')
				.setDescription('Restart the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('kill')
				.setDescription('Kill the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('message')
				.setDescription('Send a message to the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
				.addStringOption((o) => o.setName('message').setDescription('The message to send to the server').setRequired(true))
				.addStringOption((o) =>
					o.setName('type').setDescription('The type of message to send').setRequired(true).addChoices({ name: 'Notice', value: 'notice' }, { name: 'Alert', value: 'alert' })
				)
		),
	options: {
		cooldown: 5,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const server = interaction.options.getString('server');
		const command = interaction.options.getSubcommand();
		const [instanceId, friendlyName, instanceModule] = server.split(' | ').map((i) => i.trim());
		const API = await instanceAPI(instanceId);

		// Switch statement to determine the command to run
		switch (command) {
			case 'start':
				console.log('Starting server');
				break;
			case 'stop':
				console.log('Stopping server');
				break;
			case 'restart':
				console.log('Restarting server');
				break;
			case 'kill':
				console.log('Killing server');
				break;
			case 'message':
				const message = interaction.options.getString('message');
				switch (instanceModule) {
					case 'Minecraft':
						const type = interaction.options.getString('type');
						// Set the color and hover event based on the type
						let color, hoverText;
						switch (type) {
							case 'notice':
								color = 'green';
								hoverText = 'Notice';
								break;
							case 'alert':
								color = 'red';
								hoverText = 'Alert';
								break;
							default:
								break;
						}

						// Send the message to the server
						await sendConsoleMessage(
							API,
							`tellraw @a [{"text":""},{"text":"[${hoverText}] ","color":"${color}","hoverEvent":{"action":"show_text","contents":[{"text":"Server ${hoverText}","color":"${color}"}]}},{"text":"${message}"}]`
						);
						// Play an alert sound
						await alertSoundMC(API, type);
						break;

					default:
						await sendConsoleMessage(API, `say "[${type}] ${message}"`);
						break;
				}
				break;
		}
	},
};
