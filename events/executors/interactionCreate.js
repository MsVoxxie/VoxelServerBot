const { Events } = require('discord.js');
const Logger = require('../../functions/logging/logger');

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			// Get command, return if no command found.
			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) return Logger.error(`No command matching ${interaction.commandName} was found.`);

			try {
				// Check if command is dev only
				if (command.options.devOnly) {
					if (!process.env.DEVELOPERS.includes(interaction.user.id)) {
						return interaction.reply({ content: 'This command is for developers only.', ephemeral: true });
					}
				}

				// Check if command is disabled
				if (command.options.disabled) {
					return interaction.reply({ content: 'This command is disabled.', ephemeral: true });
				}

				// Execute Command
				if (interaction.guild) {
					const settings = await client.getGuild(interaction.guild);
					await command.execute(client, interaction, settings);
				} else {
					await command.execute(client, interaction);
				}
			} catch (error) {
				interaction.reply({ content: `An error occurred executing ${interaction.commandName}`, ephemeral: true });
				Logger.error(`Error executing ${interaction.commandName}`);
				Logger.error(error);
			}
		}
	},
};
