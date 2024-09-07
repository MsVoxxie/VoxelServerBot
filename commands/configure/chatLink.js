const { SlashCommandBuilder } = require('discord.js');
const { Guild } = require('../../models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setchatlink')
		.setDescription('Set the chat link for a specified server.')
		.addStringOption((option) => option.setName('server').setDescription('The server to set the chat link for.').setRequired(true).setAutocomplete(true))
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to set the chat link for.')),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Declarations
		const fetchedResult = interaction.options.getString('server');
		const channel = interaction.options.getChannel('channel') || null;

		// Split the fetched result into instanceId and instanceFriendlyName
		const [server, friendlyName] = fetchedResult.split(' | ').map((i) => i.trim());

		console.log(server, friendlyName);

		// Check if the server exists
		const checkServer = await Guild.findOne({
			guildId: interaction.guildId,
			'chatLinks.instanceId': server,
			...('chatLinks.channelId' ? { 'chatLinks.channelId': channel?.id } : {}),
		});
		if (checkServer) return interaction.reply({ content: 'This server already has a chat link set.', ephemeral: true });

		// Check if the channel is valid
		if (channel) {
			// Add the chat link
			await Guild.findOneAndUpdate(
				{ guildId: interaction.guildId },
				{ $push: { chatLinks: { instanceFriendlyName: friendlyName, instanceId: server, channelId: channel.id } } },
				{ upsert: true }
			);
			await interaction.reply({ content: `Chat link set for ${friendlyName} in <#${channel.id}>.`, ephemeral: true });
		} else {
			// Remove the chat link
			await Guild.findOneAndUpdate({ guildId: interaction.guildId }, { $pull: { chatLinks: { instanceId: server } } });
			await interaction.reply({ content: `Chat link removed for ${friendlyName}.`, ephemeral: true });
		}
	},
};
