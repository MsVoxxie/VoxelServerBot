const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceID = 'a4183b92-8629-442f-a616-eb49aa71afaf';

		const inst = await instanceAPI(instanceID);

		console.log(inst);
	},
};
