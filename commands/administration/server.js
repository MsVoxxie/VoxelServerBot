const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, codeBlock, InteractionContextType, ApplicationIntegrationType } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { alertSoundMC } = require('../../functions/helpers/messageFuncs');
const { trimString } = require('../../functions/helpers/stringFuncs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Execute a method on the specified server')
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((c) =>
			c
				.setName('start')
				.setDescription('Start the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('stop')
				.setDescription('Gracefully stop the server')
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
				.setName('update')
				.setDescription('Update the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		)
		.addSubcommand((c) =>
			c
				.setName('kill')
				.setDescription('Forcefully stop the server (WARNING: DATA LOSS MAY OCCUR)')
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
		)
		.addSubcommand((c) =>
			c
				.setName('rcon')
				.setDescription('Execute an RCON command on the server')
				.addStringOption((o) => o.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
				.addStringOption((o) => o.setName('command').setDescription('The RCON command to execute').setRequired(true))
		),
	options: {
		cooldown: 5,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer the reply
		await interaction.deferReply({});

		// Fetch options
		const server = interaction.options.getString('server');
		const command = interaction.options.getSubcommand();
		const [instanceId, friendlyName, instanceModule, instanceImage] = server.split('|').map((i) => i.trim());
		const API = await instanceAPI(instanceId);

		// Switch statement to determine the command to run
		switch (command) {
			case 'start':
				// Start the server
				await API.Core.StartAsync()
					.then(async () => {
						await interaction.followUp({ content: `Server ${friendlyName} has been requested to start` });
					})
					.catch(async (err) => {
						await interaction.followUp({ content: `Failed to request server start.\n${friendlyName}` });
						console.error(err);
					});
				break;
			case 'stop':
				await API.Core.StopAsync()
					.then(async () => {
						await interaction.followUp({ content: `Server ${friendlyName} has been requested to stop.` });
					})
					.catch(async (err) => {
						await interaction.followUp({ content: `Failed to request server stop.\n${friendlyName}` });
						console.error(err);
					});
				break;
			case 'restart':
				await API.Core.RestartAsync()
					.then(async () => {
						await interaction.followUp({ content: `Server ${friendlyName} has been requested to restart` });
					})
					.catch(async (err) => {
						await interaction.followUp({ content: `Failed to request server restart.\n${friendlyName}` });
						console.error(err);
					});

				break;

			case 'update':
				await API.Core.UpdateApplicationAsync()
					.then(async () => {
						await interaction.followUp({ content: `Server ${friendlyName} has been requested to update.` });
					})
					.catch(async (err) => {
						await interaction.followUp({ content: `Failed to request server update.\n${friendlyName}` });
						console.error(err);
					});

				break;

			case 'kill':
				await API.Core.KillAsync()
					.then(async () => {
						await interaction.followUp({ content: `Server ${friendlyName} has been killed` });
					})
					.catch(async (err) => {
						await interaction.followUp({ content: `Failed to kill server.\n${friendlyName}` });
						console.error(err);
					});

				break;
			case 'message':
				const message = interaction.options.getString('message');
				const type = interaction.options.getString('type');
				console.log(instanceModule);

				switch (instanceModule) {
					// Set the color and hover event based on the type
					case 'Minecraft':
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
				await interaction.followUp({ content: `Message sent to ${friendlyName}` });
				break;

			case 'rcon':
				const rconCmd = interaction.options.getString('command');

				// GetUpdates to clear the console
				await API.Core.GetUpdatesAsync();

				// Execute the RCON command
				await sendConsoleMessage(API, rconCmd);

				// Wait half a second for the command to be processed
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Fetch the last console message
				const consoleResponse = await API.Core.GetUpdatesAsync();
				const consoleOutput = consoleResponse.ConsoleEntries.sort((a, b) => a.Timestamp - b.Timestamp);

				// Format the output for user readability
				const formattedOutput = consoleOutput.map((i) => `${i.Contents}`).join('\n') || 'No console output returned';

				// Build an embed
				const embed = new EmbedBuilder()
					.setTitle(`RCON Command Executed on ${friendlyName}`)
					.addFields({
						name: '📥 Command',
						value: codeBlock('js', rconCmd),
						inline: true,
					})
					.addFields({
						name: '📤 Result',
						value: codeBlock('js', trimString(formattedOutput, 812)),
					})
					.setColor(client.colors.success)
					.setTimestamp();

				// Send the embed to the user
				await interaction.followUp({ embeds: [embed] });
				break;

			default:
				await interaction.followUp({ content: 'Invalid command' });
				break;
		}
	},
};
