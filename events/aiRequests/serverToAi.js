const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { askAI } = require('../../functions/helpers/aiRequest');
const { ampInstances } = require('../../models');

module.exports = {
	name: 'receivedAi',
	runType: 'infinity',
	async execute(client, data) {
		// Send webhook
		await aiLink(data.MESSAGE, data.USER, data.INSTANCE);

		// Function for sanity
		async function aiLink(MESSAGE = 'Placeholder', USER = 'Placeholder', INSTANCE = 'Placeholder') {
			// Check if the message starts with 'How do I' or what is

			if (!MESSAGE.startsWith('#')) return;

			// Fetch the instance to get the game version
			const instanceData = await ampInstances.findOne({ 'instances.instanceId': INSTANCE });
			const instance = instanceData.instances.find((i) => i.instanceId === INSTANCE);

			// Define the AI's personality as an experienced minecraft player who knows all the ins and outs of the game and recipes from mods and mod mechanics
			const aiPersonality = `I am an experienced Minecraft player who knows all the ins and outs of the game and recipes from mods and mod mechanics, Expect users to ask about modded minecraft more often than not. I keep my responses concise and to the point but with some fun sass all while providing the most accurate information possible without any fluff. Do not format your answers in any way, keep them as sentences. If something is outside of your data set, dont mention being an ai, just say you dont know. The current minecraft version is ${instance.minecraftVersion} and you are speaking to ${USER}.`;

			const aiRequest = await askAI('gpt-4o', aiPersonality, MESSAGE, 400);

			// Send messages to server
			const API = await instanceAPI(INSTANCE);
			await sendConsoleMessage(API, `tellraw @a ["","[",{"text":"MinecraftPro87","color":"gold"},"] ",{"text":"${aiRequest}","color":"yellow"}]`);

			// Send the answer to discord
			await serverLink('MinecraftPro87', `### [A] ${aiRequest}`, INSTANCE);
		}
	},
};
