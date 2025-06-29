const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
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
			console.log(currentMOTD);

			const serverStart = client.serverStartTime(START);
			const timeMsg = `Took ${serverStart}`;
			MESSAGE = `Ready | ${currentMOTD.currentValue ? `${currentMOTD.currentValue}\n` : ''}${timeMsg}`;
		}

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, null, MESSAGE, INSTANCE);
	},
};
