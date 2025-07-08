const { getInstanceStatus, getOnlinePlayers } = require('../../functions/ampAPI/instanceFunctions');
const { getInstanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { calculateSleepingPercentage } = require('../../functions/serverFuncs/minecraft');
const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { sendToWeb } = require('../../functions/helpers/toWeb');

module.exports = {
	name: 'userLeaves',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, UUID, INSTANCE, MESSAGE } = data;
		let augmentedMessage = MESSAGE;

		// Get the player's play time
		const playKey = `${USER}:${INSTANCE}`;
		const playTime = client.playTimers.get(playKey);

		if (playTime) {
			const playDuration = client.getDuration(playTime, Date.now());
			augmentedMessage += `\n-# They played for ${playDuration.join(', ')}`;
		}

		// Dynamic sleepPercentage for minecraft servers, Experimental
		if (client.experimentalFeatures) {
			const instanceInfo = await getInstanceStatus(INSTANCE);
			if (instanceInfo.status.module === 'MinecraftModule') {
				// Calculate the sleeping percentage
				const onlinePlayers = await getOnlinePlayers(INSTANCE);
				const maxPlayers = instanceInfo.status.users.MaxValue;
				const { sleepPercentage, requiredToSleep } = calculateSleepingPercentage(onlinePlayers.players.length, maxPlayers);

				// Augment the message with the sleep percentage
				if (onlinePlayers.players.length >= 1) {
					augmentedMessage += `\n-# ${onlinePlayers.players.length}/${maxPlayers} Players, sleepPercentage set to ${sleepPercentage}% (${requiredToSleep})`;
				} else {
					augmentedMessage += `\n-# Server is empty.`;
				}
				await sendConsoleMessage(INSTANCE, `gamerule playersSleepingPercentage ${sleepPercentage}`);
			}
		}

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, UUID ? UUID : null, augmentedMessage, INSTANCE);
		// Remove the user's play timer
		client.playTimers.delete(playKey);
		try {
			sendToWeb(INSTANCE, USER, MESSAGE);
		} catch (error) {
			null;
		}
	},
};
