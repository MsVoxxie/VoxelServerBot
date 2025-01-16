const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { getInstanceStatus, getOnlinePlayers } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverinfo')
		.setDescription('Check information about a server')
		.setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
		.addStringOption((option) => option.setName('server').setDescription('The server to request whitelisting on').setRequired(true).setAutocomplete(true)),
	options: {
		cooldown: 30,
		devOnly: false,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch options
		const server = interaction.options.getString('server');
		const [instanceId, friendlyName] = server.split(' | ').map((i) => i.trim());

		// Get the instance status
		const instanceInfo = await getInstanceStatus(instanceId);
		const instanceUserList = await getOnlinePlayers(instanceId);

		if (!instanceInfo.success) return interaction.reply({ content: 'This instance is offline.', flags: MessageFlags.Ephemeral });

		// Build performance data
		const performanceData = `${
			instanceInfo.status.performance
				? `**Perf:** ${instanceInfo.status.performance.RawValue}/${instanceInfo.status.performance.MaxValue} ${instanceInfo.status.performance.Unit}`
				: ''
		}`;

		// Build the embed
		const embed = new EmbedBuilder()
			.setTitle(`${friendlyName}'s Status`)
			.setColor(client.colors.base)
			.setTimestamp()
			.setDescription(
				`**Uptime:** ${instanceInfo.status.uptime}
            **Active Users:** ${instanceInfo.status.users.RawValue}/${instanceInfo.status.users.MaxValue}
            **CPU Usage:** ${instanceInfo.status.cpu.Percent}%
            **Memory Usage:** ${instanceInfo.status.memory.RawValue.toLocaleString()}/${instanceInfo.status.memory.MaxValue.toLocaleString()} (${
					instanceInfo.status.memory.Percent
				}%)
            ${performanceData}`
			)
			.addFields({
				name: 'Online Players',
				value: instanceUserList.players.map((player) => player.name).join(', ') || 'No players online',
			});

		// Send the embed
		await interaction.reply({ embeds: [embed] });
	},
};
