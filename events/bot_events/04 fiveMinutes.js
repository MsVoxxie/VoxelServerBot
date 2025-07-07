const { chatLink } = require('../../models');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');

const lastTopics = new Map();

module.exports = {
	name: 'twoMinutes',
	runType: 'infinity',
	async execute(client) {
		const chatlinkFetch = await chatLink.find().lean();
		const chatLinks = chatlinkFetch[0].chatLinks;
		if (!chatLinks.length) return;

		for (const chatLinkData of chatLinks) {
			const channel = client.channels.cache.get(chatLinkData.channelId);
			const instance = chatLinkData.instanceId;
			let channelDesc;

			const instData = await getInstanceStatus(instance);

			if (!instData.success) {
				channelDesc = 'Server is Offline or Restarting';
			} else {
				let tps = instData.status.performance
					? `\n${instData.status.performance.Unit}: ${instData.status.performance.RawValue} / ${instData.status.performance.MaxValue}`
					: '';
				channelDesc = `Online Users: ${instData.status.users.RawValue} / ${instData.status.users.MaxValue}\nUptime: ${instData.status.uptime}${tps}`;
			}

			const currentDesc = channel.topic;
			const lastSetDesc = lastTopics.get(channel.id);

			// Only update if topic is different from both current and last set
			if (currentDesc === channelDesc || lastSetDesc === channelDesc) continue;

			try {
				await channel.setTopic(channelDesc);
				lastTopics.set(channel.id, channelDesc);
				// Wait 2 seconds between updates to avoid burst rate limits
				await new Promise((res) => setTimeout(res, 2 * 1000));
			} catch (err) {
				console.error(`Failed to update topic for channel ${channel.id}:`, err);
				if (err.code === 20028 || err.status === 429) {
					// Discord rate limit error
					const retryAfter = err.retry_after || (err.data && err.data.retry_after) || 5000;
					console.warn(`Rate limited. Waiting ${retryAfter}ms before retrying...`);
					try {
						// Only retry once to avoid infinite loops
						await new Promise((res) => setTimeout(res, retryAfter));
						await channel.setTopic(channelDesc);
						lastTopics.set(channel.id, channelDesc);
						// Wait 2 seconds after retry
						await new Promise((res) => setTimeout(res, 2 * 1000));
					} catch (retryErr) {
						console.error(`Retry failed for channel ${channel.id}:`, retryErr);
					}
				}
			}
		}
	},
};
