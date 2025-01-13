const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceID = '5c81e562-b093-418d-b622-7f271a11d58b';

		// Send the message to the server
		const API = await instanceAPI(instanceID);

		// Randomized variance added to the pitch, max of 0.2 and min of 0.1
		const pitch = Math.random() * (0.2 - 0.1) + 0.1;
		await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
		await new Promise((resolve) => setTimeout(resolve, 100));
		await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
		await new Promise((resolve) => setTimeout(resolve, 250));
		await sendConsoleMessage(API, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1 + pitch} 0.25`);
	},
};
