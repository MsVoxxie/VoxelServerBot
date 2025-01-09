const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		client.emit('fiveMinutes');
	},
};
