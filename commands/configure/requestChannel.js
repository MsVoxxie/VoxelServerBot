const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { Guild } = require('../../models');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_request_channel')
		.setDescription('Set the channel for whitelist requests')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to set as the whitelist request channel').setRequired(true)),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const channel = interaction.options.getChannel('channel');

		await Guild.findOneAndUpdate({ guildId: interaction.guild.id }, { requestChannel: channel.id }, { upsert: true }).then(() => {
			interaction.reply({ content: `Whitelist requests will now be sent to ${channel}.`, flags: MessageFlags.Ephemeral });
		});
	},
};
