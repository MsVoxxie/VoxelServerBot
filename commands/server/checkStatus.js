const { SlashCommandBuilder, PermissionFlagsBits, codeBlock, EmbedBuilder } = require('discord.js');
const Gamedig = require('gamedig');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check_status')
		.setDescription('Check the status of a Server')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
	options: {
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Query Server
		let OFFLINE = false;
		const QUERY = await Gamedig.query({ type: 'minecraft', host: process.env.SERVER_IP, port: 25565 }).catch((err) => {
			OFFLINE = true;
			return interaction.reply('Server is Offline!');
		});
		if (OFFLINE) return;

		// Format Data
		const CONN_INFO = codeBlock('css', `IP: ${QUERY.connect}`);
		const PLAYER_COUNT = codeBlock('css', `Player Count: ${QUERY.players.length}/${QUERY.maxplayers}`);
		const SERVER_MOTD = codeBlock(`MOTD: ${QUERY.name}`);
		const CURRENT_PLAYERS = codeBlock(`Current Players:\n${QUERY.players.map((p) => p.name).join('\n')}`);

		// Build Embed
		const embed = new EmbedBuilder()
			.setTitle('LL7 Server Info')
			.setColor(client.colors.base)
			.setDescription(`${SERVER_MOTD}${PLAYER_COUNT}${CURRENT_PLAYERS}`)
			.setTimestamp();

		interaction.reply({ embeds: [embed] });
	},
};
