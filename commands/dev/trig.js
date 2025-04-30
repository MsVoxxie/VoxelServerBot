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
		const inst = await mainAPI();
		const Status = await inst.Core.GetStatusAsync();
		console.log(Status);
	},
};
