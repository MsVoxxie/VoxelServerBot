const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rcon')
		.setDescription('Execute an RCON command on the specified server')
		.addStringOption((option) => option.setName('server').setDescription('The server to execute the RCON command on').setRequired(true).setAutocomplete(true))
		.addStringOption((option) => option.setName('command').setDescription('The RCON command to execute').setRequired(true)),
	options: {
		cooldown: 30,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const server = interaction.options.getString('server');
		const command = interaction.options.getString('command');
		const [instanceId, friendlyName] = server.split(' | ').map((i) => i.trim());

		// Get the instance status
		const instanceInfo = await getInstanceStatus(instanceId);
		if (!instanceInfo.success) return interaction.reply({ content: 'This instance is offline.', ephemeral: true });

		// Send the rcon command
		const API = await instanceAPI(instanceId);
		await sendConsoleMessage(API, command);

		// Build the embed
		const embed = new EmbedBuilder()
			.setTitle('RCON Command Executed')
			.setDescription(`**Server:** ${friendlyName}\n**Command:** ${command}`)
			.setColor(client.colors.success)
			.setTimestamp();

		// Send the embed
		await interaction.reply({ embeds: [embed] });
	},
};
