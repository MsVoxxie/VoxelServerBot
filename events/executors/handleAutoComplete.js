const { Events } = require('discord.js');
const { ampInstances } = require('../../models');

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (!interaction.isAutocomplete()) return;
		// Get the command name
		const command = client.commands.get(interaction.commandName);
		const focusedOption = interaction.options.getFocused();
		const allInstances = await ampInstances.findOne({});

		// Switchcase for the command name
		switch (command.data.name) {
			case 'managechatlink':
				// Filter the instances
				const filteredChoice = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false);

				// Map the results
				const filteredResults = filteredChoice.map((i) => {
					return {
						name: `${i.instanceFriendlyName} • ${i.instanceId}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResults.slice(0, 25)).catch(() => {});

				break;

			case 'whitelist_request':
				// Filter the instances
				const filteredChoiceWhitelist = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false)
					.filter((i) => i.instanceModule === 'Minecraft');

				// Map the results
				const filteredResultsWhitelist = filteredChoiceWhitelist.map((i) => {
					return {
						name: `${i.instanceFriendlyName}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResultsWhitelist.slice(0, 25)).catch(() => {});
				break;
		}
	},
};
