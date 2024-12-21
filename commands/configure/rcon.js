const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rcon')
		.setDescription('Execute an RCON command on the specified server')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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

		// Send the rcon command
		const API = await instanceAPI(instanceId);
		await sendConsoleMessage(API, command);

		// Build the embed
		const embed = new EmbedBuilder()
			.setTitle('RCON Command Executed')
			.setDescription(`**Server:** ${friendlyName}\n**Command:** \`${command}\``)
			.setColor(client.colors.success)
			.setTimestamp();

		// Send the embed
		await interaction.reply({ embeds: [embed] });

		// Inform the server members of the command being executed
		await sendConsoleMessage(
			API,
			`tellraw @a ["","[",{"text":"RCON","color":"dark_red"},"] ",{"text":"Executing Command ","color":"blue"},{"text":"${command}","color":"gold"}]`
		);
	},
};
