const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { getPlayerHead } = require('../../functions/serverFuncs/cacheHeads');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cachehead')
		.setDescription('Cache Head Command')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option) => option.setName('username').setDescription('The username to cache').setRequired(true)),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const username = interaction.options.getString('username');
		try {
			const { path, attachment } = await getPlayerHead(username);

			// Send the attachment to the user
			await interaction.reply({ files: [attachment], content: `Head cached for ${username}` });

			console.log(`Head cached for ${username}: ${path}`);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'Failed to cache head' });
		}
	},
};
