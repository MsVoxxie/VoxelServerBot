const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getInstanceStatus } = require('../../functions/ampAPI/instanceFunctions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('instance_status')
		.setDescription('Check the status of an instance')
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
		if (!instanceInfo.success) return interaction.reply({ content: 'This instance is offline.', ephemeral: true });

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
			);

		// Send the embed
		await interaction.reply({ embeds: [embed] });
	},
};
