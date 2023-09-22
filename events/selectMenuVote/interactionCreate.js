const { Events, EmbedBuilder } = require('discord.js');
const { loadAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: Events.InteractionCreate,
	runType: 'infinity',
	async execute(client, interaction) {
		if (!interaction.isStringSelectMenu() && interaction.customId !== 'server_restart_vote') return;

		//CONSTANTS
		const REQUIRED_VOTES = 3;
		const SPLIT_VALUES = interaction.values[0].split('_');
		const SERVER_PORT = SPLIT_VALUES[1];
		const SERVER_NAME = SPLIT_VALUES[0].toUpperCase();

		// Build Embed and Send
		const embed = new EmbedBuilder()
			.setTitle(`${SERVER_NAME} Restart Vote`)
			.setDescription(`${interaction.member.displayName} would like to restart the server.`)
			.addFields({ name: 'Current Votes', value: '0', inline: true }, { name: 'Needed Votes', value: REQUIRED_VOTES.toString(), inline: true })
			.setColor(client.colors.base);
		const replyEmbed = await interaction.reply({ embeds: [embed], fetchReply: true });
		await replyEmbed.react('✅');

		// Await Reactions
		const reactionFilter = (reaction, user) => {
			return reaction.emoji.name === '✅' && user.id !== interaction.guild.members.me.id; // && user.id !== interaction.member.id;
		};

		const collector = await replyEmbed.createReactionCollector({
			filter: reactionFilter,
			time: 300 * 1000,
			errors: ['time'],
			max: REQUIRED_VOTES,
		});
		collector.on('collect', async (reaction, user) => {
			console.log('Collected!');
			const currentVotes = replyEmbed.embeds[0].fields[0];
			const updatedVotes = currentVotes.value++ + 1;

			const embed = new EmbedBuilder()
				.setTitle(`${SERVER_NAME} Restart Vote`)
				.setDescription(`${interaction.member.displayName} would like to restart the server.`)
				.addFields(
					{ name: 'Current Votes', value: updatedVotes.toString(), inline: true },
					{ name: 'Needed Votes', value: REQUIRED_VOTES.toString(), inline: true }
				)
				.setColor(client.colors.base);

			await replyEmbed.edit({ embeds: [embed] });
		});

		collector.on('end', async (collected, reason) => {
			// Vote Passed!
			if (reason === 'limit') {
				const embed = new EmbedBuilder()
					.setTitle(`${SERVER_NAME} Restart Vote`)
					.setDescription(`${interaction.member.displayName} would like to restart the server.\n\n\`Vote Passed, Restarting Server!\``)
					.setColor(client.colors.success);
				await replyEmbed.edit({ embeds: [embed] });
				await replyEmbed.reactions.removeAll();

				try {
					// Restart Server
					const API = await loadAPI(SERVER_PORT);
					await sendConsoleMessage(API, 'say Discord Server restart vote Passed, Restarting in 1 minute.');
					await sleep(60 * 1000);
					await sendConsoleMessage(API, 'say Server Restarting!');
					await sleep(3 * 1000);
					await API.Core.RestartAsync();
				} catch (error) {
					console.error(error);
				}

				// Timed Out
			} else if (reason === 'time') {
				const embed = new EmbedBuilder()
					.setTitle(`${SERVER_NAME} Restart Vote`)
					.setDescription(`${interaction.member.displayName} would like to restart the server.\n\n\`Vote Failed!\``)
					.setColor(client.colors.error);
				await replyEmbed.edit({ embeds: [embed] });
				await replyEmbed.reactions.removeAll();
			}
		});
	},
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
