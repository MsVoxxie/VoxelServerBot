const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { askAI } = require('../../functions/helpers/aiRequest');

module.exports = {
	name: 'receivedAi',
	runType: 'infinity',
	async execute(client, data) {
		// Send webhook
		await aiLink(data.MESSAGE, data.INSTANCE);

		// Function for sanity
		async function aiLink(MESSAGE = 'Placeholder', INSTANCE = 'Placeholder') {
			// Check if the message starts with 'How do I' or what is

			if (!MESSAGE.startsWith('#')) return;

			// Define the AI's personality as an experienced minecraft player who knows all the ins and outs of the game and recipes from mods and mod mechanics
			const aiPersonality =
				'I am an experienced Minecraft player who knows all the ins and outs of the game and recipes from mods and mod mechanics. I keep  my responses concise and to the point while providing the most accurate information possible without any fluff. Do not format your answers in any way, keep them as sentences.';

			const aiRequest = await askAI('gpt-4o', aiPersonality, MESSAGE, 400);

			// Send messages to server
			const API = await instanceAPI(INSTANCE);
			await sendConsoleMessage(API, `tellraw @a ["","[",{"text":"MinecraftPro87","color":"gold"},"] ",{"text":"${aiRequest}","color":"yellow"}]`);
		}
	},
};
