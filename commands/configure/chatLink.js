const { SlashCommandBuilder, PermissionFlagsBits, WebhookClient } = require('discord.js');
const { instanceAPI } = require('../../functions/ampAPI/apiFunctions');
const Logger = require('../../functions/logging/logger');
const { chatLink, ampInstances } = require('../../models');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('managechatlink')
		.setDescription('Manage the chat link for a specified server and channel.')
		.addStringOption((option) => option.setName('server').setDescription('The server to set the chat link for.').setRequired(true).setAutocomplete(true))
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to set the chat link for.').setRequired(true)),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		// Declarations
		const fetchedResult = interaction.options.getString('server');
		const channel = interaction.options.getChannel('channel');

		// Webhook info
		let webhookId = '';
		let webhookToken = '';

		// Split the fetched result into instanceId and instanceFriendlyName
		const [server, friendlyName] = fetchedResult.split(' | ').map((i) => i.trim());

		// Check if the server exists
		const checkServer = await chatLink.findOne({ 'chatLinks.instanceId': server, 'chatLinks.channelId': channel.id });

		// Check if the channel is valid
		if (!checkServer) {
			// Fetch the instance data from the database
			const instanceData = await ampInstances.findOne({ 'instances.instanceId': server });
			if (!instanceData) return interaction.reply({ content: 'The server you specified does not exist.', ephemeral: true });
			// Get the specific instance data
			const instance = instanceData.instances.find((i) => i.instanceId === server);
			if (!instance) return interaction.reply({ content: 'The server you specified does not exist.', ephemeral: true });

			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.reply({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			// Add the event trigger for when a player sends a message and set it to enabled
			const serverInstance = await instanceAPI(server);
			await serverInstance.Core.AddEventTriggerAsync('dbc16e38-6bbf-4cea-a936-e395cfa66f46');
			await serverInstance.Core.SetTriggerEnabledAsync('dbc16e38-6bbf-4cea-a936-e395cfa66f46', true);

			// Post request dictionary
			const postDict = {
				URI: 'https://vsb.voxxie.me/v1/server/link',
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: '{@Message}', INSTANCE: '{@InstanceId}' }),
				ContentType: 'application/json',
			};

			// Add the task to send the message to the api
			await serverInstance.Core.AddTaskAsync('dbc16e38-6bbf-4cea-a936-e395cfa66f46', 'Event.WebRequestPlugin.MakePOSTRequest', postDict);

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();

			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				webhookId = clHook.id;
				webhookToken = clHook.token;
			} else {
				// Create the webhook
				await channel.createWebhook({ name: `${friendlyName} Chat Link` }).then((wh) => {
					Logger.info(`Created webhook for ${channel.name} in ${interaction.guild.name}`);

					webhookId = wh.id;
					webhookToken = wh.token;
				});
			}

			// Add the chat link
			await chatLink.findOneAndUpdate(
				{},
				{
					$push: {
						chatLinks: {
							webhookId,
							webhookToken,
							instanceModule: instance.instanceModule,
							instanceFriendlyName: friendlyName,
							instanceId: server,
							channelId: channel.id,
						},
					},
				},
				{ upsert: true }
			);

			await interaction.reply({ content: `Chat link set for ${friendlyName} in <#${channel.id}>.`, ephemeral: true });
		} else {
			// Remove the chat link
			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.reply({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			await chatLink.findOneAndUpdate({}, { $pull: { chatLinks: { instanceId: server } } });

			// Remove the event trigger for when a player sends a message and it's task
			const serverInstance = await instanceAPI(server);
			const scheduleData = await serverInstance.Core.GetScheduleDataAsync();

			try {
				// Find the task with the Id of 'dbc16e38-6bbf-4cea-a936-e395cfa66f46'
				const allTasks = scheduleData.PopulatedTriggers.find((t) => t.Id === 'dbc16e38-6bbf-4cea-a936-e395cfa66f46');
				// Delete the task with the TaskMethodName of 'Event.WebRequestPlugin.MakePOSTRequest'
				const postTask = allTasks.Tasks.find((t) => t.TaskMethodName === 'Event.WebRequestPlugin.MakePOSTRequest');
				await serverInstance.Core.DeleteTaskAsync('dbc16e38-6bbf-4cea-a936-e395cfa66f46', postTask.Id);
				await serverInstance.Core.DeleteTriggerAsync('dbc16e38-6bbf-4cea-a936-e395cfa66f46');
			} catch (error) {
				console.log(error);
			}

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();
			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				await clHook.delete();
				Logger.info(`Deleted webhook for ${channel.name} in ${interaction.guild.name}`);
			}

			await interaction.reply({ content: `Chat link removed for ${friendlyName} from <#${channel.id}>.`, ephemeral: true });
		}
	},
};
