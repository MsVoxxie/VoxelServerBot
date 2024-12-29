const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getConfigNode } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceID = 'c66361cb-a5d3-47a4-bcdc-a55f13d8e091';

		const inst = await getConfigNode(instanceID, 'MinecraftModule.Minecraft.ServerMOTD');

		console.log(inst);
	},
};
