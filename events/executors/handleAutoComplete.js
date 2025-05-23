const { Events } = require('discord.js');
const { ampInstances } = require('../../models');
const { fetchInstanceStatuses } = require('../../functions/ampAPI/instanceFunctions');

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
			case 'chatlink':
				// Filter the instances
				const filteredChoiceChatLink = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false)
					.filter((i) => i.instanceRunning === true);

				// Map the results
				const filteredResultsChatLink = filteredChoiceChatLink.map((i) => {
					return {
						name: `${i.instanceFriendlyName} • ${i.instanceId}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResultsChatLink.slice(0, 25)).catch(() => {});

				break;

			case 'serverinfo':
				// Filter the instances
				const filteredChoiceStatus = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false)
					.filter((i) => i.instanceRunning === true);

				// Map the results
				const filteredResultsStatus = filteredChoiceStatus.map((i) => {
					return {
						name: `${i.instanceFriendlyName} • ${i.instanceId}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResultsStatus.slice(0, 25)).catch(() => {});

				break;

			case 'whitelist_request':
				// Filter the instances
				const filteredChoiceWhitelist = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false)
					.filter((i) => i.instanceRunning === true)
					.filter((i) => i.instanceModule === 'Minecraft');

				// Map the results
				const filteredResultsWhitelist = filteredChoiceWhitelist.map((i) => {
					return {
						name: `${i.instanceFriendlyName}`,
						value: `${i.instanceId} | ${i.applicationPort} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredResultsWhitelist.slice(0, 25)).catch(() => {});
				break;

			case 'rcon':
				// Filter the instances
				const filteredRconChoiceStatus = allInstances.instances
					.filter((i) => i.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceSuspended === false)
					.filter((i) => i.instanceRunning === true);

				// Map the results
				const filteredRconResultsStatus = filteredRconChoiceStatus.map((i) => {
					return {
						name: `${i.instanceFriendlyName} • ${i.instanceId}`,
						value: `${i.instanceId} | ${i.instanceFriendlyName}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredRconResultsStatus.slice(0, 25)).catch(() => {});

				break;

			case 'server':
				// Fetch all of the instances
				const allServerInstances = await fetchInstanceStatuses();

				// Filter the instances
				const filteredServerChoiceStatus = allServerInstances.instances
					.filter((i) => i.instanceInfo.instanceName.toLowerCase().includes(focusedOption.toLowerCase()))
					.filter((i) => i.instanceInfo.instanceSuspended === false)
					.filter((i) => i.instanceInfo.instanceRunning === true);

				// Map the results
				const filteredServerResultsStatus = filteredServerChoiceStatus.map((i) => {
					return {
						name: `${i.serverInfo.state ? `[${i.serverInfo.state}]` : '[Unknown]'} ${i.instanceInfo.instanceFriendlyName} • ${i.instanceInfo.instanceId}`,
						value: `${i.instanceInfo.instanceId}|${i.instanceInfo.instanceFriendlyName}|${i.instanceInfo.instanceModule}`,
					};
				});

				// Reply with all of the instances
				await interaction.respond(filteredServerResultsStatus.slice(0, 25)).catch((e) => null);

				break;
		}
	},
};
