const { SlashCommandBuilder } = require('discord.js');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger, getConfigNode, setConfigNode } = require('../../functions/ampAPI/eventFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceId = '0c07c0ae-bf66-4f9f-8c38-1873ba4c7321';

		const API = await instanceAPI(instanceId);
		console.log(API);
	},
};
