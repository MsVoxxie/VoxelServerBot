const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, PermissionFlagsBits } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { getConfigNode } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whitelist_request')
		.setDescription('Request whitelist for a Minecraft server')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('server').setDescription('The server to request whitelisting on').setRequired(true).setAutocomplete(true))
		.addStringOption((option) => option.setName('username').setDescription('Your minecraft username (Case Sensitive, Space_Sensitive)').setRequired(true)),
	options: {
		cooldown: 30,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const server = interaction.options.getString('server');
		const username = interaction.options.getString('username');

		const [instanceId, applicationPort, friendlyName] = server.split(' | ').map((i) => i.trim());

		// Get the whitelist status
		const whitelistEnabled = await getConfigNode(instanceId, 'MinecraftModule.Game.Whitelist');
		if (!whitelistEnabled.currentValue) return interaction.reply({ content: 'Whitelisting is not enabled on this server.', ephemeral: true });

		// Fetch the request channel
		const requestChannel = await interaction.guild.channels.fetch(settings.requestChannel);

		// Create Buttons
		const verificationButtons = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel('Confirm')
				.setStyle(ButtonStyle.Success)
				.setCustomId(`accept|${interaction.member.id}|${username}|${instanceId}|${applicationPort}|${friendlyName}`),
			new ButtonBuilder()
				.setLabel('Deny')
				.setStyle(ButtonStyle.Danger)
				.setCustomId(`deny|${interaction.member.id}|${username}|${instanceId}|${applicationPort}|${friendlyName}`)
		);

		// Build the embed
		const embed = new EmbedBuilder()
			.setTitle('Whitelist Request')
			.setDescription(`**Server:** ${friendlyName}\n**Username:** ${username}`)
			.setFooter({ text: `Requested by ${interaction.member.displayName}`, iconURL: interaction.member.displayAvatarURL() })
			.setColor(Colors.DarkOrange)
			.setTimestamp();

		// Send the message
		await requestChannel.send({ embeds: [embed], components: [verificationButtons] });
		await interaction.reply({ content: 'Your request has been sent, Please wait to be accepted.', ephemeral: true });

		// Send a message to the server
		const API = await instanceAPI(instanceId);
		await sendConsoleMessage(
			API,
			`tellraw @a ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Request Received ","color":"yellow"},"→ ",{"text":"${username}","color":"dark_purple"}]`
		);
	},
};
