const { Events, PermissionFlagsBits, Colors, EmbedBuilder, MessageFlags } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');
const { SERVER_IP } = process.env;

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (!interaction.isButton()) return;
		// Defers the reply to the interaction
		await interaction.deferUpdate();

		// Declarations
		const staffMember = interaction.member;
		const message = interaction.message;
		const [action, memberId, minecraftUsername, instanceId, applicationPort, friendlyName] = interaction.customId.split('|');
		if (action !== 'accept' && action !== 'deny') return;

		// Check if the staff member has the manage_members permission
		if (!staffMember.permissions.has(PermissionFlagsBits.ManageRoles)) return;

		const API = await instanceAPI(instanceId);
		if (!API) interaction.followUp({ content: 'An error occurred while trying to fetch the instance API.', flags: MessageFlags.Ephemeral });

		// GetUpdates to clear the console
		await API.Core.GetUpdatesAsync();

		// Wait 1 second to allow the console to clear
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Accept or deny the whitelist request
		switch (action) {
			case 'accept':
				try {
					// Accept the whitelist request
					await sendConsoleMessage(API, `whitelist add ${minecraftUsername.trim().toString()}`);

					// Wait 1 second to allow the console to update
					await new Promise((resolve) => setTimeout(resolve, 2000));

					// Check the console for updates
					const consoleResponse = await API.Core.GetUpdatesAsync();
					const consoleOutput = consoleResponse.ConsoleEntries.filter((i) => i.Contents === 'That player does not exist').sort((a, b) => a.Timestamp - b.Timestamp);

					//! If the player does not exist, Fail the request
					if (consoleOutput.length > 0) {
						await sendConsoleMessage(API, `whitelist remove ${minecraftUsername.trim()}`);
						await sendConsoleMessage(
							API,
							`tellraw @a ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Failed to add ","color":"dark_red"},{"text":"${minecraftUsername.trim()}","color":"aqua"}]`
						);

						// Edit the embed to show the request has failed
						const embed = new EmbedBuilder()
							.setTitle('Whitelist Request Failed')
							.setDescription(`**Server:** ${friendlyName}\n**Username:** ${minecraftUsername.trim()}\n**Status:** Failed\n**Reason:** The player does not exist.`)
							.setFooter({ text: `Attempted by ${staffMember.displayName}`, iconURL: staffMember.displayAvatarURL() })
							.setColor(Colors.Red)
							.setTimestamp();
						await message.edit({ embeds: [embed], components: [] });

						// Send a message to the user
						const member = interaction.guild.members.cache.get(memberId);
						await member.send(`Your whitelist request has failed for ${friendlyName}.\n**Reason:** The player does not exist.`);
						return;
					}

					await sendConsoleMessage(
						API,
						`tellraw @a ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Added ","color":"green"},{"text":"${minecraftUsername.trim()}","color":"aqua"}]`
					);

					// Edit the embed to show the request has been accepted
					const embed = new EmbedBuilder()
						.setTitle('Whitelist Request Accepted')
						.setDescription(`**Server:** ${friendlyName}\n**Username:** ${minecraftUsername.trim()}\n**Status:** Accepted`)
						.setFooter({ text: `Accepted by ${staffMember.displayName}`, iconURL: staffMember.displayAvatarURL() })
						.setColor(Colors.Green)
						.setTimestamp();
					await message.edit({ embeds: [embed], components: [] });

					// Send a message to the user
					const member = interaction.guild.members.cache.get(memberId);
					await member.send(`Whitelist request accepted for ${friendlyName}.\n**Server IP:** \`${SERVER_IP}:${applicationPort}\`\nHave fun!`);
				} catch (error) {
					console.error(error);
				}
				break;

			case 'deny':
				try {
					// Show the deny message
					await sendConsoleMessage(API, `whitelist remove ${minecraftUsername}`);
					await sendConsoleMessage(
						API,
						`tellraw @a ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Denied ","color":"dark_red"},{"text":"${minecraftUsername.trim()}","color":"aqua"}]`
					);

					// Edit the embed to show the request has been denied
					const embed = new EmbedBuilder()
						.setTitle('Whitelist Request Denied')
						.setDescription(`**Server:** ${friendlyName}\n**Username:** ${minecraftUsername.trim()}\n**Status:** Denied`)
						.setFooter({ text: `Denied by ${staffMember.displayName}`, iconURL: staffMember.displayAvatarURL() })
						.setColor(Colors.Red)
						.setTimestamp();
					await message.edit({ embeds: [embed], components: [] });

					// Send a message to the user
					const member = interaction.guild.members.cache.get(memberId);
					await member.send(`Your whitelist request has been denied for ${friendlyName}.`);
				} catch (error) {
					console.error(error);
				}
				break;
		}
	},
};
