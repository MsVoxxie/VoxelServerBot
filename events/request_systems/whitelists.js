const { Events, PermissionFlagsBits, Colors, EmbedBuilder } = require('discord.js');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (!interaction.isButton()) return;

		// Declarations
		const staffMember = interaction.member;
		const message = interaction.message;
		const [action, memberId, minecraftUsername, instanceId, friendlyName] = interaction.customId.split('_');
		if (action !== 'accept' && action !== 'deny') return;

		// Check if the staff member has the manage_members permission
		if (!staffMember.permissions.has(PermissionFlagsBits.ManageRoles)) return;

		// Accept or deny the whitelist request
		switch (action) {
			case 'accept':
				try {
					// Accept the whitelist request
					const API = await instanceAPI(instanceId);
					await sendConsoleMessage(API, `whitelist add ${minecraftUsername}`);
					await sendConsoleMessage(API, `tellraw @p ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Added ","color":"green"},{"text":"${minecraftUsername}","color":"aqua"}]`);

					// Edit the embed to show the request has been accepted
					const embed = new EmbedBuilder()
						.setTitle('Whitelist Request')
						.setDescription(`**Server:** ${friendlyName}\n**Username:** ${minecraftUsername}\n**Status:** Accepted`)
						.setFooter({ text: `Accepted by ${staffMember.displayName}`, iconURL: staffMember.displayAvatarURL() })
						.setColor(Colors.Green)
						.setTimestamp();
					await message.edit({ embeds: [embed], components: [] });

					// Send a message to the user
					const member = interaction.guild.members.cache.get(memberId);
					await member.send(`Your whitelist request has been accepted for ${friendlyName}.`);
				} catch (error) {
					console.error(error);
				}
				break;

			case 'deny':
				try {

					// Show the deny message
					const API = await instanceAPI(instanceId);
					await sendConsoleMessage(API, `whitelist remove ${minecraftUsername}`);
					await sendConsoleMessage(API, `tellraw @p ["","[",{"text":"Whitelist","color":"gold"},"] ",{"text":"Denied ","color":"dark_red"},{"text":"${minecraftUsername}","color":"aqua"}]`)

					// Edit the embed to show the request has been denied
					const embed = new EmbedBuilder()
						.setTitle('Whitelist Request')
						.setDescription(`**Server:** ${friendlyName}\n**Username:** ${minecraftUsername}\n**Status:** Denied`)
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
