const { SlashCommandBuilder, WebhookClient, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder().setName('webhook').setDescription('testing'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const webhook = new WebhookClient({ url: settings.chatlinkWebhook.url });
		const embed = new EmbedBuilder().setColor(client.colors.base).setDescription('MsVoxxie› Test').setTimestamp();

		webhook.send({
			embeds: [embed],
		});
	},
};
