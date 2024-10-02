const { SlashCommandBuilder } = require('discord.js');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {},
};
