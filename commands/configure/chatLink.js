const { instanceAPI, fetchTriggerId, fetchTaskId, fetchTriggerTaskId } = require('../../functions/ampAPI/apiFunctions');
const { SlashCommandBuilder, PermissionFlagsBits, WebhookClient } = require('discord.js');
const { chatLink, ampInstances } = require('../../models');
const Logger = require('../../functions/logging/logger');

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
		// Defer
		await interaction.deferReply();

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
		const serverInstance = await instanceAPI(server);

		// Get the events and triggers
		//! Chat Message Triggers
		const chatMessageTrigger = await fetchTriggerId(server, 'A player sends a chat message');
		const postRequestEvent = await fetchTaskId(server, 'MakePOSTRequest');

		//! User Join and Leave Triggers
		const userJoinTrigger = await fetchTriggerId(server, 'A player joins the server');
		const userLeaveTrigger = await fetchTriggerId(server, 'A player leaves the server');

		// Check if the channel is valid
		if (!checkServer) {
			// Fetch the instance data from the database
			const instanceData = await ampInstances.findOne({ 'instances.instanceId': server });
			if (!instanceData) return interaction.followUp({ content: 'The server you specified does not exist.', ephemeral: true });
			// Get the specific instance data
			const instance = instanceData.instances.find((i) => i.instanceId === server);
			if (!instance) return interaction.followUp({ content: 'The server you specified does not exist.', ephemeral: true });

			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.followUp({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			// Chat Message Dictionary
			const chatMessageDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: '{@Message}', INSTANCE: '{@InstanceId}' }),
				ContentType: 'application/json',
			};

			// Event Dictionary
			const userJoinDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: 'has connected', INSTANCE: '{@InstanceId}' }),
				ContentType: 'application/json',
			};
			const userLeaveDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: 'has disconnected', INSTANCE: '{@InstanceId}' }),
				ContentType: 'application/json',
			};

			//!Add the trigger for the chat message
			Logger.info(`Adding chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await serverInstance.Core.AddEventTriggerAsync(chatMessageTrigger.Id);
			await serverInstance.Core.SetTriggerEnabledAsync(chatMessageTrigger.Id, true);
			await serverInstance.Core.AddTaskAsync(chatMessageTrigger.Id, postRequestEvent.Id, chatMessageDictionary);
			Logger.success(`Added chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);

			// //! Add the triggers for user join and leave
			Logger.info(`Adding user join and leave triggers for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await serverInstance.Core.AddEventTriggerAsync(userJoinTrigger.Id);
			await serverInstance.Core.SetTriggerEnabledAsync(userJoinTrigger.Id, true);
			await serverInstance.Core.AddTaskAsync(userJoinTrigger.Id, postRequestEvent.Id, userJoinDictionary);

			await serverInstance.Core.AddEventTriggerAsync(userLeaveTrigger.Id);
			await serverInstance.Core.SetTriggerEnabledAsync(userLeaveTrigger.Id, true);
			await serverInstance.Core.AddTaskAsync(userLeaveTrigger.Id, postRequestEvent.Id, userLeaveDictionary);
			Logger.success(`Added user join and leave triggers for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();

			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				webhookId = clHook.id;
				webhookToken = clHook.token;
			} else {
				// Create the webhook
				Logger.info(`Creating webhook for ${instance.instanceFriendlyName} in ${channel.name} in ${interaction.guild.name}`);
				await channel.createWebhook({ name: `${friendlyName} Chat Link`, avatar: `${process.env.SRV_API}/v1/client/static/logos/SrvLogoAlt.png` }).then((wh) => {
					Logger.success(`Created webhook for ${instance.instanceFriendlyName} in ${channel.name} in ${interaction.guild.name}`);
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
							instanceName: instance.instanceName,
							instanceFriendlyName: friendlyName,
							instanceId: server,
							channelId: channel.id,
						},
					},
				},
				{ upsert: true }
			);

			await interaction.followUp({ content: `Chat link set for ${friendlyName} in <#${channel.id}>.`, ephemeral: true });
			Logger.success('Chat link successfully linked!');
		} else {
			// Remove the chat link
			const chatMessageTask = await fetchTriggerTaskId(server, 'A player sends a chat message', 'MakePOSTRequest');
			const userJoinTask = await fetchTriggerTaskId(server, 'A player joins the server', 'MakePOSTRequest');
			const userLeaveTask = await fetchTriggerTaskId(server, 'A player leaves the server', 'MakePOSTRequest');

			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.followUp({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			// Remove the chat link from the database
			await chatLink.findOneAndUpdate({}, { $pull: { chatLinks: { instanceId: server } } });

			//! Remove the trigger and task for sending chat messages
			Logger.info(`Removing chat link for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			await serverInstance.Core.DeleteTaskAsync(chatMessageTrigger.Id, chatMessageTask.taskId);
			await serverInstance.Core.DeleteTriggerAsync(chatMessageTrigger.Id);
			Logger.success(`Removed chat link for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);

			//! Remove the triggers and tasks for user join and leave
			Logger.info(`Removing user join and leave triggers for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			await serverInstance.Core.DeleteTaskAsync(userJoinTrigger.Id, userJoinTask.taskId);
			await serverInstance.Core.DeleteTriggerAsync(userJoinTrigger.Id);

			await serverInstance.Core.DeleteTaskAsync(userLeaveTrigger.Id, userLeaveTask.taskId);
			await serverInstance.Core.DeleteTriggerAsync(userLeaveTrigger.Id);
			Logger.success(`Removed user join and leave triggers for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();
			// Find the chat link webhook
			Logger.info(`Removing webhook for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				await clHook.delete();
				Logger.success(`Removed webhook for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			}

			await interaction.followUp({ content: `Chat link removed for ${friendlyName} from <#${channel.id}>.`, ephemeral: true });
			Logger.success('Chat link successfully removed!');
		}
	},
};
