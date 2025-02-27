const { chatLink } = require('../../models');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	name: 'fiveMinutes',
	runType: 'infinity',
	async execute(client) {
		// Update chatlinked channels topics with server status
		const chatlinkFetch = await chatLink.find().lean();
		const chatLinks = chatlinkFetch[0].chatLinks;
		if (!chatLinks.length) return;

		// Loop through each chatlink asynchrously
		for await (const chatLinkData of chatLinks) {
			// Fetch the channel
			const channel = client.channels.cache.get(chatLinkData.channelId);
			const instance = chatLinkData.instanceId;
			let channelDesc;

			// Fetch the instance status
			const instanceStatus = await getInstanceStatus(instance);
			if (!instanceStatus.success) {
				channelDesc = 'Server is Offline or Restarting';
			} else {
				channelDesc = `Online Users: ${instanceStatus.status.users.RawValue} / ${instanceStatus.status.users.MaxValue}\nUptime: ${instanceStatus.status.uptime}`;
			}

			// Check if the channel description is the saem as the server status to prevent api spam
			const currentDesc = channel.topic;
			if (currentDesc === channelDesc) continue;

			// Update the channel description
			await channel.setTopic(channelDesc);
		}
	},
};
