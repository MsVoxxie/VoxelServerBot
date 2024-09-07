const { SlashCommandBuilder, PermissionFlagsBits, WebhookClient } = require('discord.js');
const { Guild } = require('../../models');
const Logger = require('../../functions/logging/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('managechatlink')
		.setDescription('Manage the chat link for a specified server and channel.')
		.addStringOption((option) => option.setName('server').setDescription('The server to set the chat link for.').setRequired(true).setAutocomplete(true))
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to set the chat link for.').setRequired(true)),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Declarations
		const fetchedResult = interaction.options.getString('server');
		const channel = interaction.options.getChannel('channel');

		// Webhook info
		let webhookId = '';
		let webhookToken = '';

		// Split the fetched result into instanceId and instanceFriendlyName
		const [server, friendlyName] = fetchedResult.split(' | ').map((i) => i.trim());

		console.log(server, friendlyName);

		// Check if the server exists
		const checkServer = await Guild.findOne({ guildId: interaction.guildId, 'chatLinks.instanceId': server, 'chatLinks.channelId': channel.id });

		// Check if the channel is valid
		if (!checkServer) {
			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.reply({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();

			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				webhookId = clHook.id;
				webhookToken = clHook.token;
			} else {
				// Create the webhook
				await channel.createWebhook({ name: `${friendlyName} Chat Link` }).then((wh) => {
					Logger.info(`Created webhook for ${channel.name} in ${interaction.guild.name}`);

					webhookId = wh.id;
					webhookToken = wh.token;
				});
			}

			// Add the chat link
			await Guild.findOneAndUpdate(
				{ guildId: interaction.guildId },
				{
					$push: {
						chatLinks: {
							webhookId,
							webhookToken,
							instanceFriendlyName: friendlyName,
							instanceId: server,
							channelId: channel.id,
						},
					},
				},
				{ upsert: true }
			);

			await interaction.reply({ content: `Chat link set for ${friendlyName} in <#${channel.id}>.`, ephemeral: true });
		} else {
			// Remove the chat link
			try {
				await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $pull: { chatLinks: { instanceId: server } } });

				// Fetch the webhooks in the channel
				const webhooks = await channel.fetchWebhooks();
				// Find the chat link webhook
				const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
				if (clHook) {
					await clHook.delete();
					Logger.info(`Deleted webhook for ${channel.name} in ${interaction.guild.name}`);
				}

				await interaction.reply({ content: `Chat link removed for ${friendlyName} from <#${channel.id}>.`, ephemeral: true });
			} catch (error) {
				await interaction.reply({ content: `I was unable to delete the chat link. Can I manage webhooks for this channel?`, ephemeral: true });
			}
		}
	},
};
