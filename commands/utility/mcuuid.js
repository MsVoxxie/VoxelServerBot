const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags, codeBlock } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mc_uuid')
		.setDescription("Fetch a Minecraft user's UUID")
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('username').setDescription('The username to fetch').setRequired(true)),
	options: {
		cooldown: 30,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const username = interaction.options.getString('username');

		// Fetch the Minecraft profile
		const uuidReq = new Request(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`, { headers: { 'Content-Type': 'application/json' } });
		const usernameUUID = await fetch(uuidReq);
		const { id, name } = await usernameUUID.json();

		// Fetch mcskin body
		const headFetch = `https://mc-heads.net/head/${id}/left`;

		// Build the embed
		const embed = new EmbedBuilder()
			.setDescription(`${codeBlock('yaml', `${formatUUID(id)}`)}`)
			.setTitle(`UUID lookup for ${name}`)
			.setColor(client.colors.base)
			.setThumbnail(headFetch)
			.setTimestamp();

		// Send the embed
		await interaction.reply({ embeds: [embed] });
	},
};

function formatUUID(input) {
	return input.replace(/^([a-fA-F0-9]{8})([a-fA-F0-9]{4})([a-fA-F0-9]{4})([a-fA-F0-9]{4})([a-fA-F0-9]{12})$/, '$1-$2-$3-$4-$5');
}
