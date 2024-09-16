const { SlashCommandBuilder } = require('discord.js');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceId = '8be4a730-3d0d-499c-9ca4-cad9b355f65f';

		const status = await getInstanceStatus(instanceId);
		console.log(status);
	},
};
