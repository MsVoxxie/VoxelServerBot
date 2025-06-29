const { getConfigNode } = require('../../functions/ampAPI/instanceFunctions');
const { serverLink } = require('../../functions/helpers/messageDiscord');

// Track users that have received a join message
const userJoinedSet = new Set();

// Clear the set every 10 seconds
const clearInt = 10 * 1000;
setInterval(() => {
	userJoinedSet.clear();
}, clearInt);

module.exports = {
	name: 'receivedChat',
	runType: 'disabled',
	async execute(client, data) {
		let { USER, MESSAGE } = data;

		// If the USER is SERVER and the MESSAGE is Ready, Let's get the time it took to start the server
		if (USER === 'SERVER' && MESSAGE === 'Ready') {
			const currentMOTD = await getConfigNode(data.INSTANCE, 'MinecraftModule.Minecraft.ServerMOTD');
			const serverStart = client.serverStartTime(data.START);
			MESSAGE = `${currentMOTD.currentValue} is now Online\nTook ${serverStart}`;
		}

		// Allow only the first join message to be sent for each user //! This Sucks
		if (MESSAGE === 'has connected' || MESSAGE === 'joined for the first time') {
			if (userJoinedSet.has(USER)) {
				return;
			} else {
				userJoinedSet.add(USER);
			}
		}

		// Send webhook
		await serverLink(USER, null, MESSAGE, data.INSTANCE);
	},
};
