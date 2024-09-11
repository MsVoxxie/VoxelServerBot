const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/eventFunctions');
const { instanceAPI, fetchTriggerId, fetchTaskId, fetchTriggerTaskId } = require('../../functions/ampAPI/apiFunctions');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
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
		const checkServer = await chatLink.findOne({ chatLinks: { $elemMatch: { instanceId: server, channelId: channel.id } } });

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

			const appStateDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: '{@State}', INSTANCE: '{@InstanceId}' }),
				ContentType: 'application/json',
			};

			//!Add the trigger for the chat message
			Logger.info(`Adding chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player sends a chat message');
			await addTaskToTrigger(server, 'A player sends a chat message', 'MakePOSTRequest', chatMessageDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for user join
			Logger.info(`Adding user join and leave triggers for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player joins the server');
			await addTaskToTrigger(server, 'A player joins the server', 'MakePOSTRequest', userJoinDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added user join trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for user leave
			await addEventTrigger(server, 'A player leaves the server');
			await addTaskToTrigger(server, 'A player leaves the server', 'MakePOSTRequest', userLeaveDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added user leave trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for app state
			await addEventTrigger(server, 'The application state changes');
			await addTaskToTrigger(server, 'The application state changes', 'IfCondition', { ValueToCheck: '{@State}', Operation: '3', ValueToCompare: 'Pre' });
			await addTaskToTrigger(server, 'The application state changes', 'MakePOSTRequest', appStateDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added app state trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();

			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				// webhookId = clHook.id;
				// webhookToken = clHook.token;
				return interaction.followUp({ content: 'A chat link already exists for this server in this channel.', ephemeral: true });
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
			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.followUp({ content: 'I do not have permission to manage webhooks in this channel.', ephemeral: true });

			//! Check if any other chat links exist for this server, if so, dont remove the triggers and tasks
			// Fetch only the matching instanceId
			const otherChatLinks = await chatLink.find({ 'chatLinks.instanceId': server }).lean();
			const instanceIds = otherChatLinks[0].chatLinks.map((c) => c.instanceId);
			const duplicateIds = instanceIds.filter((id) => id === server);

			// If there are no duplicates, remove the triggers and tasks
			if (duplicateIds.length === 1) {
				//! Remove the trigger and task for sending chat messages
				Logger.info(`Removing chat link for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A player sends a chat message', 'MakePOSTRequest');
				await removeEventTrigger(server, 'A player sends a chat message').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed chat link for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for user join
				Logger.info(`Removing user join and leave triggers for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A player joins the server', 'MakePOSTRequest');
				await removeEventTrigger(server, 'A player joins the server').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed user join trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for user leave
				await removeTaskFromTrigger(server, 'A player leaves the server', 'MakePOSTRequest');
				await removeEventTrigger(server, 'A player leaves the server').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed user leave trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for app state
				await removeTaskFromTrigger(server, 'The application state changes', 'MakePOSTRequest');
				await removeEventTrigger(server, 'The application state changes').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed app state trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});
			}

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();
			// Find the chat link webhook
			Logger.info(`Removing webhook for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				await clHook.delete();
				Logger.success(`Removed webhook for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
			}

			// Remove the chat link from the database
			await chatLink.findOneAndUpdate({}, { $pull: { chatLinks: { instanceId: server, channelId: channel.id } } });

			await interaction.followUp({ content: `Chat link removed for ${friendlyName} from <#${channel.id}>.`, ephemeral: true });
			Logger.success('Chat link successfully removed!');
		}
	},
};
