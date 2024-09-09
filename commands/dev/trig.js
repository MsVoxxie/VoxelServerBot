const { SlashCommandBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {},
};
