const { Events } = require('discord.js');
const { ampInstances } = require('../../models');

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (!interaction.isAutocomplete()) return;
		// Get the command name
		const command = client.commands.get(interaction.commandName);

		// Switchcase for the command name
		switch (command.data.name) {
			case 'setchatlink':
				const focusedOption = interaction.options.getFocused();
				const allInstances = await ampInstances.findOne({});

				// Filter the instances
				const filteredChoice = allInstances.instances.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()));

				// Map the results
				const filteredResults = filteredChoice.map((i) => {
					return {
						name: `${i.instanceFriendlyName} | ${i.instanceId}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResults.slice(0, 25)).catch(() => {});

				break;
		}
	},
};
