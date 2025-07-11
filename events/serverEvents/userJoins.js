const { getInstanceStatus, getOnlinePlayers } = require('../../functions/ampAPI/instanceFunctions');
const { getInstanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { calculateSleepingPercentage } = require('../../functions/serverFuncs/minecraft');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { sendToWeb } = require('../../functions/helpers/toWeb');

// Track users that have received a join message
const userJoinedSet = new Set();

// Clear the set every 10 seconds
const clearInt = 10 * 1000;
setInterval(() => {
	userJoinedSet.clear();
}, clearInt);

module.exports = {
	name: 'userJoins',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, UUID, INSTANCE, MESSAGE } = data;
		let augmentedMessage = MESSAGE;

		// Dynamic sleepPercentage for minecraft servers, Experimental
		if (client.experimentalFeatures) {
			const instanceInfo = await getInstanceStatus(INSTANCE);
			if (instanceInfo.status.module === 'MinecraftModule') {
				// Calculate the sleeping percentage
				const onlinePlayers = await getOnlinePlayers(INSTANCE);
				const maxPlayers = instanceInfo.status.users.MaxValue;
				const { sleepPercentage, requiredToSleep } = calculateSleepingPercentage(onlinePlayers.players.length, maxPlayers);

				// Augment the message with the sleep percentage
				if (onlinePlayers.players.length >= 2) {
					augmentedMessage = `${MESSAGE}\n-# ${onlinePlayers.players.length}/${maxPlayers} Players, sleepPercentage set to ${sleepPercentage}% (${requiredToSleep})`;
				}
				await sendConsoleMessage(INSTANCE, `gamerule playersSleepingPercentage ${sleepPercentage}`);
			}
		}

		// Allow only the first join message to be sent for each user
		const joinMessages = ['has connected', 'joined for the first time'];

		if (joinMessages.includes(MESSAGE) && !userJoinedSet.has(USER)) {
			userJoinedSet.add(USER);

			// Use a string key for playTimers
			const playKey = `${USER}:${INSTANCE}`;
			// Start the users play timer if it doesn't exist
			if (!client.playTimers.has(playKey)) {
				client.playTimers.set(playKey, Date.now());
			}

			// Send off the message to Discord
			queueTask(INSTANCE, serverLink, USER, UUID ? UUID : null, augmentedMessage, INSTANCE);
			try {
				sendToWeb(INSTANCE, USER, MESSAGE);
			} catch (error) {
				null;
			}
		}
	},
};
