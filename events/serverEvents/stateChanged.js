const { serverLink } = require('../../functions/helpers/messageDiscord');
const { getConfigNode } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	name: 'stateChanged',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, START } = data;
		let { MESSAGE } = data;

		// Format the start time for the Ready message
		if (USER === 'SERVER' && MESSAGE === 'Ready') {
			const currentMOTD = await getConfigNode(INSTANCE, 'MinecraftModule.Minecraft.ServerMOTD');
			const serverStart = client.serverStartTime(START);
			MESSAGE = `${currentMOTD.currentValue} is now Online\nTook ${serverStart}`;
		}

		// Send off the message to Discord
		await serverLink(USER, MESSAGE, INSTANCE);
	},
};
