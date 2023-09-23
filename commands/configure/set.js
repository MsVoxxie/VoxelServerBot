const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../../models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set')
		.setDescription('Set Configurations')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommandGroup((sGroup) =>
			sGroup
				.setName('chatlink')
				.setDescription('Channel to link server chat with.')
				.addSubcommand((sCmd) =>
					sCmd
						.setName('link')
						.setDescription('Link Channel')
						.addChannelOption((opt) => opt.setName('channel').setDescription('Link Channel').setRequired(true))
				)
				.addSubcommand((sCmd) => sCmd.setName('unlink').setDescription('Unlink Channel'))
		),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Get subcommand
		const subGroup = interaction.options.getSubcommandGroup();
		const subCommand = interaction.options.getSubcommand();

		switch (subGroup) {
			case 'chatlink':
				if (subCommand === 'link') {
					// Get channel
					const chatLink = interaction.options.getChannel('channel');
					// Make sure channel is a text channel
					if (!chatLink.isTextBased()) return interaction.reply('Channel must be a text channel');
					// Check if a webhook exists.
					const webCheck = await interaction.channel.fetchWebhooks();
					let mappedWebhooks = webCheck.map((wh) => wh.name);
					// if (mappedWebhooks.includes('ChatLink')) return interaction.reply('A Webhook already exists for this channel.');
					// Create Webhook for Channel
					const webHook = await interaction.channel.createWebhook({
						name: 'ChatLink',
						avatar: 'https://vsb.voxxie.me/v1/client/static/logos/VoxelIco_lg.png',
					});
					// Set webhook data in database
					await Guild.findOneAndUpdate(
						{ guildId: interaction.guild.id },
						{ chatlinkWebhook: { url: webHook.url, channelId: chatLink.id } },
						{ upsert: true, new: true }
					);
					// Follow upchatLink
					interaction.reply(`Chatlink channel set to ${chatLink}`);
				} else if (subCommand === 'unlink') {
				}
				break;

			default:
				break;
		}
	},
};
