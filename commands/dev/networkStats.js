const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ApplicationIntegrationType, EmbedBuilder, InteractionContextType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('networkstats')
		.setDescription('Get network statistics')
		.setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
		.setContexts([InteractionContextType.Guild, InteractionContextType.PrivateChannel])
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addBooleanOption((option) => option.setName('ephemeral').setDescription('Reply with an ephemeral message').setRequired(false)),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Toggle ephemeral response if specified
		const ephemeral = interaction.options.getBoolean('ephemeral') || false;

		const { network } = require('../../core/loaders/networkLoader');
		const embed = new EmbedBuilder()
			.setColor(client.colors.base)
			.setTitle('Network Statistics')
			.setFooter({ text: `Last Spike at: ${network.lastSpikeTime ? new Date(network.lastSpikeTime).toLocaleString() : 'N/A'}` })
			.addFields([
				{ name: 'External Ping', value: `⇄ ${network.externalPing} ms`, inline: true },
				{ name: 'External Avg', value: `↻ ${network.externalAvg} ms`, inline: true },
				{ name: 'External Median', value: `⬌ ${network.externalMedian} ms`, inline: true },
				{ name: 'Internal Down', value: `↓ ${network.internalDown} Mbps`, inline: true },
				{ name: 'Internal Up', value: `↑ ${network.internalUp} Mbps`, inline: true },
				{ name: 'Last Spike', value: network.lastSpike && network.lastSpike != '✓ Stable' ? `↟ ${network.lastSpike} ms` : '✓ No Spikes', inline: true },
			]);

		// Send the response
		if (ephemeral) {
			await interaction.reply({
				embeds: [embed],
				flags: MessageFlags.Ephemeral,
			});
		} else {
			await interaction.reply({
				embeds: [embed],
			});
		}
	},
};
