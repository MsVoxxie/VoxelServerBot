const { SlashCommandBuilder } = require('discord.js');
const { ampInstances } = require('../../models');

module.exports = {
	data: new SlashCommandBuilder().setName('get_instances').setDescription("Get Server Instance ID's"),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Fetch all instances for AMP
		const instances = await ampInstances.findOne({});
		if (!instances) return interaction.reply({ content: 'No instances found in the database.', ephemeral: true });

		// Tell the user that the information has been sent to the console.
		await interaction.reply({ content: 'Check the console for the list of instances.', ephemeral: true });

		// Log the instances to the console
		console.log(instances.instances);
	},
};
