const { SlashCommandBuilder } = require('discord.js');
const { fetchTriggerId, fetchEventId } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const triggerID = await fetchEventId('8be4a730-3d0d-499c-9ca4-cad9b355f65f', 'DiscordMessage');

		console.log(triggerID);
	},
};
