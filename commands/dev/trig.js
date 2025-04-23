const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { mainAPI, instanceAPI } = require('../../functions/ampAPI/apiFunctions');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Flood the queue with tasks to test the queue system

		for (let i = 0; i < 15; i++) {}
	},
};
