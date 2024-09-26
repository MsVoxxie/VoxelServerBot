const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Logger = require('../../functions/logging/logger');
const { updatesLink } = require('../../models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('updateschannel')
		.setDescription('Manage the updates channel')
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to send updates to.').setRequired(true)),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer
		await interaction.deferReply();

		// Declarations
		const channel = interaction.options.getChannel('channel');

		// Webhook info
		let webhookId = '';
		let webhookToken = '';

		// Check that the bot can manage webhooks
		if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks)) {
			return interaction.editReply({ content: 'I need the `Manage Webhooks` permission in the channel you want to set as the updates channel.' });
		}

		// Fetch the webhooks in the channel
		const webhook = await channel.fetchWebhooks();
		const updatesWebhook = webhook.find((w) => w.name === 'VoxelServers Updates');

		// Check if the updates webhook exists
		if (!updatesWebhook) {
			// Create the webhook
			await channel.createWebhook({ name: `VoxelServers Updates`, avatar: `${process.env.SRV_API}/v1/client/static/logos/SrvLogoAlt.png` }).then((webhook) => {
				Logger.info(`Created webhook ${webhook.id} in ${channel.id}`);
				webhookId = webhook.id;
				webhookToken = webhook.token;
			});

			// Save the updates channel to the database
			await updatesLink.findOneAndUpdate({ guildId: interaction.guild.id }, { webhookId, webhookToken, channelId: channel.id }, { upsert: true });

			// Send the reply
			return interaction.followUp({ content: `The updates channel has been set to ${channel}.` });
		} else {
			// Delete the webhook if it exists
			await updatesWebhook.delete().then(async () => {
				Logger.info(`Deleted webhook ${updatesWebhook.id} in ${channel.id}`);
				// Remove the updates channel from the database
				await updatesLink.findOneAndDelete({ guildId: interaction.guild.id, channelId: channel.id });

				// Send the reply
				return interaction.followUp({ content: `The updates channel has been removed.` });
			});
		}
	},
};
