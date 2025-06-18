const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { mainAPI, getInstanceAPI } = require('../../functions/ampAPI/apiFunctions');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('apply_defaults')
		.setDescription('Reapply default settings to instances')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Defer the reply
		await interaction.deferReply();

		// Get the ADS API
		const API = await mainAPI();

		// Get all the instances
		const getInstances = await API.ADSModule.GetInstancesAsync();
		const instanceIDs = getInstances[0].AvailableInstances.filter((instance) => instance.InstanceName !== 'ADS01' && instance.Running !== false)
			.map((instance) => ({ name: instance.InstanceName, id: instance.InstanceID }))
			.sort((a, b) => a.name.localeCompare(b.name));

		// Get the default settings from the ADS module
		const getInstanceDefaults = await API.Core.GetConfigAsync('ADSModule.Defaults.DefaultSettings');
		const instanceDefaults = getInstanceDefaults.CurrentValue;

		// Sort settings by key name
		const sortedDefaults = Object.fromEntries(Object.entries(instanceDefaults).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

		// Apply the settings to each instance
		for await (const instance of instanceIDs) {
			console.log(`Applying settings to ${instance.name} - (${instance.id})...`);

			try {
				const instAPI = await getInstanceAPI(instance.id);
				await instAPI.Core.SetConfigsAsync(sortedDefaults);
			} catch (error) {
				console.log(`❌ Failed to apply settings to ${instance.name} - (${instance.id})...`);
				continue;
			} finally {
				console.log(`✅ Settings applied to ${instance.name} - (${instance.id})...`);
			}
		}
		console.log('All instances processed.');

		// Send a response to the interaction
		await interaction.followUp({
			content: 'Default settings have been reapplied to all online instances.',
		});
	},
};
