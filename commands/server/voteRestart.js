const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { ActionRowBuilder, SelectMenuBuilder } = require('@discordjs/builders');

const serverInstances = [{ name: 'All The Mods 9', id: 'atm9', port: '8084' }];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote_restart')
		.setDescription('Vote Restart a Specific Server')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Build ActionRow
		const selectMenu = new ActionRowBuilder().setComponents(
			new SelectMenuBuilder().setCustomId('server_restart_vote').setOptions(
				serverInstances.map((srv) => {
					const formatted = {
						label: srv.name,
						value: `${srv.id}_${srv.port}`,
					};
					return formatted;
				})
			)
		);

		// Send it
		interaction.reply({ content: 'Which server would you like to restart?', components: [selectMenu], ephemeral: true });
	},
};
