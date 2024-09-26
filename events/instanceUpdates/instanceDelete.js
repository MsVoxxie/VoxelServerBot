const { EmbedBuilder } = require('@discordjs/builders');
const { updatesLink } = require('../../models');
const { WebhookClient, Colors } = require('discord.js');

module.exports = {
	name: 'serverInstanceDeleted',
	runType: 'infinity',
	async execute(client, instance) {
		// Check for any updates channels
		const updatesChannels = await updatesLink.find({});
		if (!updatesChannels.length) return;

		// Send the message to the updates channels
		for (const updatesChannel of updatesChannels) {
			const channel = await client.channels.fetch(updatesChannel.channelId);
			if (!channel) continue;

			// Build the embed
			const embed = new EmbedBuilder()
				.setTitle('Instance Deleted')
				.setFooter({ text: 'VoxelServers' })
				.setColor(Colors.Red)
				.setTimestamp()
				.setDescription(`Instance: **${instance.instanceFriendlyName}** (${instance.instanceName})\nDeleted: **${client.relTimestamp(Date.now())}**`);

			// Create and Send
			const webhook = new WebhookClient({ id: updatesChannel.webhookId, token: updatesChannel.webhookToken });
			await webhook.send({
				embeds: [embed],
			});
		}
	},
};
