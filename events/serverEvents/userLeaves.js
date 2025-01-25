const { getInstanceStatus, getOnlinePlayers } = require('../../functions/ampAPI/instanceFunctions');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { calculateSleepingPercentage } = require('../../functions/serverFuncs/minecraft');
const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'userLeaves',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Send off the message to Discord
		await serverLink(USER, MESSAGE, INSTANCE);

		// Dynamic sleepPercentage for minecraft servers, Experimental
		if (!client.experimentalFeatures) return;
		const instanceInfo = await getInstanceStatus(INSTANCE);
		if (instanceInfo.status.module !== 'MinecraftModule') return;

		// Calculate the sleeping percentage
		const onlinePlayers = await getOnlinePlayers(INSTANCE);
		const maxPlayers = instanceInfo.status.users.MaxValue;
		const sleepPercentage = calculateSleepingPercentage(onlinePlayers.players.length, maxPlayers);

		// Send the message to the server
		const API = await instanceAPI(INSTANCE);
		await sendConsoleMessage(API, `gamerule playersSleepingPercentage ${sleepPercentage}`);
	},
};
