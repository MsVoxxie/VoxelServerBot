const { getInstanceStatus, getOnlinePlayers } = require('../../functions/ampAPI/instanceFunctions');
const { getInstanceAPI, sendConsoleMessage, getSevenDaysToDieTime } = require('../../functions/ampAPI/apiFunctions');
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

		if (client.experimentalFeatures) {
			const instanceInfo = await getInstanceStatus(INSTANCE);
			switch (instanceInfo.status.moduleName || instanceInfo.status.module) {
				case 'MinecraftModule':
					// Calculate the sleeping percentage
					const onlinePlayers = await getOnlinePlayers(INSTANCE);
					const maxPlayers = instanceInfo.status.users.MaxValue;
					const { sleepPercentage, requiredToSleep } = calculateSleepingPercentage(onlinePlayers.players.length, maxPlayers);

					// Augment the message with the sleep percentage
					if (onlinePlayers.players.length >= 2) {
						augmentedMessage = `${MESSAGE}\n-# ${onlinePlayers.players.length}/${maxPlayers} Players, sleepPercentage set to ${sleepPercentage}% (${requiredToSleep})`;
					}
					await sendConsoleMessage(INSTANCE, `gamerule playersSleepingPercentage ${sleepPercentage}`);
					break;

				case 'Seven Days To Die':
					const curTime = await getSevenDaysToDieTime(INSTANCE);
					if (curTime) augmentedMessage = `${MESSAGE}\n-# Day ${curTime.day}, Time: ${curTime.time}`;
					break;
				default:
					break;
			}
		}

		// Allow only the first join message to be sent for each user
		const joinMessages = ['has connected', 'joined for the first time'];

		if (!client.joinMessages) client.joinMessages = new Map();

		if (joinMessages.includes(MESSAGE) && !userJoinedSet.has(USER)) {
			userJoinedSet.add(USER);

			const playKey = `${USER}:${INSTANCE}`;

			let playData = client.playTimers.get(playKey);
			if (!playData) {
				playData = { time: Date.now(), sentMessages: [] };
				client.playTimers.set(playKey, playData);
			}

			const sentMessages = await queueTask(INSTANCE, serverLink, USER, UUID ? UUID : null, augmentedMessage, INSTANCE);
			if (Array.isArray(sentMessages) && sentMessages.length > 0) {
				playData.sentMessages = sentMessages; // Store array of {id, webhookId, webhookToken}
				client.playTimers.set(playKey, playData); // Update the map
			}

			try {
				sendToWeb(INSTANCE, USER, MESSAGE);
			} catch (error) {
				null;
			}
		}
	},
};
