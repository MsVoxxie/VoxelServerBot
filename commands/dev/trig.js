const { SlashCommandBuilder } = require('discord.js');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger, getConfigNode, setConfigNode } = require('../../functions/ampAPI/eventFunctions');
module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceId = '5f0dc49e-0a5b-4198-b17b-e8c3ff56b519';

		const whitelistEnabled = await getConfigNode(instanceId, 'MinecraftModule.Game.Whitelist');

		if (whitelistEnabled.currentValue) {
			await setConfigNode(instanceId, 'MinecraftModule.Game.Whitelist', 'false');
		} else {
			await setConfigNode(instanceId, 'MinecraftModule.Game.Whitelist', 'true');
		}
	},
};
