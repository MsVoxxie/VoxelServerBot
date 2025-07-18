const { chatLink } = require('../../models');
const { getInstanceAPI, sendConsoleMessage, getSevenDaysToDieTime } = require('../../functions/ampAPI/apiFunctions');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');
const { queueTask } = require('../../functions/helpers/queueTask');
const { serverLink } = require('../../functions/helpers/messageDiscord');

module.exports = {
	name: 'fifteenMinutes',
	runType: 'infinity',
	async execute(client) {
		// Fetch all chat links
		const chatlinkFetch = await chatLink.find({}).lean();
		if (!chatlinkFetch.length) return;

		for (const chatLinkData of chatlinkFetch[0].chatLinks) {
			// Check that each chat link is online and has players
			const instanceId = chatLinkData.instanceId;
			const instanceAPI = await getInstanceAPI(instanceId);
			if (!instanceAPI) continue;
			const instanceStatus = await getInstanceStatus(instanceId);
			if (!instanceStatus || instanceStatus.status.state !== 'Running' || instanceStatus.status.users.RawValue <= 0) continue;

			// Lastly, Check if the instance moduleName is Seven Days To Die
			if (instanceStatus.status.moduleName !== 'Seven Days To Die') continue;

			// Grab the time from the 7d server
			await getSevenDaysToDieTime(instanceId).then((curTime) => {
				const isBadNight = curTime.day % 7 === 0 ? `***${curTime.day}***` : `${curTime.day}`;
				let msg = `-# It's Day ${isBadNight} at ${curTime.time}`;
				queueTask(instanceId, serverLink, 'SERVER', null, msg, instanceId);
			});
		}
	},
};
