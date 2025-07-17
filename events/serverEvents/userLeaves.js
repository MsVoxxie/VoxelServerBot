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
		const { USER, UUID, INSTANCE, MESSAGE } = data;
		let augmentedMessage = MESSAGE;

		const playKey = `${USER}:${INSTANCE}`;
		const playData = client.playTimers.get(playKey);

		// Bounce quick leaves
		const bounceThreshold = 5 * 60 * 1000;
		if (playData && Date.now() - playData.time < bounceThreshold && Array.isArray(playData.sentMessages)) {
			const { WebhookClient } = require('discord.js');
			console.log('Quick leave detected for', USER, 'in', INSTANCE, 'bouncing messages');

			for (const msg of playData.sentMessages) {
				try {
					const webhook = new WebhookClient({ id: msg.webhookId, token: msg.webhookToken });
					await webhook.deleteMessage(msg.id).catch(() => {});
				} catch (e) {
					null;
				}
			}
			client.playTimers.delete(playKey);
			return;
		}

		// Augments
		if (playData) {
			const playDuration = client.getDuration(playData.time, Date.now());
			let hours = 0;
			if (playDuration && playDuration.length > 0) {
				const match = playDuration[0].match(/^(\d+)\s+hour/);
				if (match) hours = parseInt(match[1]);
			}
			let augment = '';
			if (hours >= 10) augment = ' and should really get some rest...';
			else if (hours >= 8) augment = ' ';
			else if (hours >= 6) augment = ' ';
			else if (hours >= 4) augment = ' ';
			augmentedMessage += `\n-# They played for ${playDuration.join(', ')}`;
		}

		if (client.experimentalFeatures) {
			const instanceInfo = await getInstanceStatus(INSTANCE);
			switch (instanceInfo.status.moduleName || instanceInfo.status.module) {
				case 'MinecraftModule': {
					const onlinePlayers = await getOnlinePlayers(INSTANCE);
					const maxPlayers = instanceInfo.status.users.MaxValue;
					const { sleepPercentage, requiredToSleep } = calculateSleepingPercentage(onlinePlayers.players.length, maxPlayers);

					if (onlinePlayers.players.length >= 1) {
						augmentedMessage += `\n-# ${onlinePlayers.players.length}/${maxPlayers} Players, sleepPercentage set to ${sleepPercentage}% (${requiredToSleep})`;
					} else {
						augmentedMessage += `\n-# Server is empty.`;
					}
					await sendConsoleMessage(INSTANCE, `gamerule playersSleepingPercentage ${sleepPercentage}`);
					break;
				}
				case 'Seven Days To Die': {
					const curTime = await getSevenDaysToDieTime(INSTANCE);
					if (curTime) augmentedMessage = `${MESSAGE}\n-# Day ${curTime.day}, Time: ${curTime.time}`;
					break;
				}
				default:
					break;
			}
		}

		queueTask(INSTANCE, serverLink, USER, UUID ? UUID : null, augmentedMessage, INSTANCE);
		client.playTimers.delete(playKey);
		try {
			sendToWeb(INSTANCE, USER, MESSAGE);
		} catch (error) {
			null;
		}
	},
};
