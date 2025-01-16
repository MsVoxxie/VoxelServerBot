const { addEventTrigger, addTaskToTrigger, changeTaskOrder, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/instanceFunctions');
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { chatLink, ampInstances } = require('../../models');
const Logger = require('../../functions/logging/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('chatlink')
		.setDescription('Manage the chat link for a specified server and channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addStringOption((option) => option.setName('server').setDescription('The server to set the chat link for.').setRequired(true).setAutocomplete(true))
		.addChannelOption((option) => option.setName('channel').setDescription('The channel to set the chat link for.').setRequired(true)),
	options: {
		devOnly: false,
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
			if (!instanceData) return interaction.followUp({ content: 'The server you specified does not exist.', flags: MessageFlags.Ephemeral });
			// Get the specific instance data
			const instance = instanceData.instances.find((i) => i.instanceId === server);
			if (!instance) return interaction.followUp({ content: 'The server you specified does not exist.', flags: MessageFlags.Ephemeral });

			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.followUp({ content: 'I do not have permission to manage webhooks in this channel.', flags: MessageFlags.Ephemeral });

			// Chat Message Dictionary
			const chatMessageDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: '{@Message}', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			// Event Dictionary
			const userJoinDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: 'has connected', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};
			const userLeaveDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: 'has disconnected', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			const appStateDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: '{@State}', INSTANCE: '{@InstanceId}', START: '{@StartTime}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			// User first join Dictionary
			const userFirstJoinDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: '{@User}', MESSAGE: 'joined for the first time', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			// Backup Dictionarys
			const backupStartDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: 'A Backup has started', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			const backupFinishDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: 'A Backup has finished archiving', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			// Crash Dictionaries
			const unResponsiveDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: 'Server is unresponsive and has been terminated', INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			const crashDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({ USER: 'SERVER', MESSAGE: "I've crashed", INSTANCE: '{@InstanceId}', EVENT: '{@TriggerName}' }),
				ContentType: 'application/json',
			};

			// Server Lagging Dictionary
			const serverLaggingDictionary = {
				URI: `${process.env.SRV_API}/v1/server/link`,
				Payload: JSON.stringify({
					USER: 'SERVER',
					MESSAGE: 'I seem to be lagging, {@MillisecondsBehind}ms or {@TicksSkipped} ticks behind',
					INSTANCE: '{@InstanceId}',
					EVENT: '{@TriggerName}',
				}),
				ContentType: 'application/json',
			};

			//!Add the trigger for the chat message
			Logger.info(`Adding chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player sends a chat message');
			await addTaskToTrigger(server, 'A player sends a chat message', 'MakePOSTRequest', chatMessageDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added chat link for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the trigger for user first join
			Logger.info(`Adding user first join trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player joins the server for the first time');
			await addTaskToTrigger(server, 'A player joins the server for the first time', 'MakePOSTRequest', userFirstJoinDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added user first join trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});
			// Add a console input to the Minecraft server to play a sound to get the attention of the players
			await addTaskToTrigger(server, 'A player joins the server for the first time', 'SendConsole', {
				Input: 'playsound minecraft:block.bell.resonate player @a 0 0 0 1 2 0.25',
			});
			// Send a message welcoming the player to the server
			await addTaskToTrigger(
				server,
				'A player joins the server for the first time',
				'SendConsole',
				{ Input: 'tellraw @p ["",{"text":"Welcome ","color":"gold"},{"text":"to the server","color":"aqua"},", ",{"text":"{@User}","color":"green"},"!"]' },
				true
			);

			//! Add the triggers for user join
			Logger.info(`Adding user join and leave triggers for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player joins the server');
			await addTaskToTrigger(server, 'A player joins the server', 'SendConsole', { Input: 'playsound minecraft:block.conduit.activate player @a 0 0 0 1 2 0.25' });
			await addTaskToTrigger(server, 'A player joins the server', 'MakePOSTRequest', userJoinDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added user join trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for user leave
			Logger.info(`Adding user leave trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A player leaves the server');
			await addTaskToTrigger(server, 'A player leaves the server', 'SendConsole', { Input: 'playsound minecraft:block.conduit.deactivate player @a 0 0 0 1 2 0.25' });
			await addTaskToTrigger(server, 'A player leaves the server', 'MakePOSTRequest', userLeaveDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added user leave trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for app state
			Logger.info(`Adding app state trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'The application state changes');
			await addTaskToTrigger(server, 'The application state changes', 'IfCondition', { ValueToCheck: '{@State}', Operation: '3', ValueToCompare: 'Pre' });
			await addTaskToTrigger(server, 'The application state changes', 'MakePOSTRequest', appStateDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added app state trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for backups
			Logger.info(`Adding backup start trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'A backup has started.');
			await addTaskToTrigger(server, 'A backup has started.', 'MakePOSTRequest', backupStartDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added backup start trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});
			await addTaskToTrigger(server, 'A backup finishes archiving.', 'MakePOSTRequest', backupFinishDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added backup finish trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Change the order of the backup finish task
			Logger.info(`Changing the order of the backup finish task for ${friendlyName} in ${channel.name} in ${interaction.guild.name}`);
			await changeTaskOrder(server, 'A backup finishes archiving.', 'MakePOSTRequest', 5).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Changed the order of the backup finish task for ${friendlyName} in ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for crashes
			Logger.info(`Adding crash triggers for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'The Minecraft Server watchdog forced a shutdown (server unresponsive)');
			await addTaskToTrigger(server, 'The Minecraft Server watchdog forced a shutdown (server unresponsive)', 'MakePOSTRequest', unResponsiveDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added crash trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			await addEventTrigger(server, 'The Minecraft Server stops unexpectedly');
			await addTaskToTrigger(server, 'The Minecraft Server stops unexpectedly', 'MakePOSTRequest', crashDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added crash trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			//! Add the triggers for server lagging
			Logger.info(`Adding server lagging trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			await addEventTrigger(server, 'The Minecraft server is unable to keep up');
			await addTaskToTrigger(server, 'The Minecraft server is unable to keep up', 'IfCondition', { ValueToCheck: '{@TicksSkipped}', Operation: '4', ValueToCompare: '300' });
			await addTaskToTrigger(server, 'The Minecraft server is unable to keep up', 'MakePOSTRequest', serverLaggingDictionary).then((e) => {
				if (!e.success) return Logger.error(e.desc);
				Logger.success(`Added server lagging trigger for ${friendlyName} to ${channel.name} in ${interaction.guild.name}`);
			});

			// Fetch the webhooks in the channel
			const webhooks = await channel.fetchWebhooks();

			// Find the chat link webhook
			const clHook = webhooks.find((w) => w.name === `${friendlyName} Chat Link`);
			if (clHook) {
				// webhookId = clHook.id;
				// webhookToken = clHook.token;
				return interaction.followUp({ content: 'A chat link already exists for this server in this channel.', flags: MessageFlags.Ephemeral });
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

			await interaction.followUp({ content: `Chat link set for ${friendlyName} in <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
			Logger.success('Chat link successfully linked!');
		} else {
			// Check that the bot can manage webhooks
			if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageWebhooks))
				return interaction.followUp({ content: 'I do not have permission to manage webhooks in this channel.', flags: MessageFlags.Ephemeral });

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

				//! Remove the trigger and task for user first join
				Logger.info(`Removing user first join trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A player joins the server for the first time', 'MakePOSTRequest');
				await removeTaskFromTrigger(server, 'A player joins the server for the first time', 'SendConsole');
				await removeTaskFromTrigger(server, 'A player joins the server for the first time', 'SendConsole');
				await removeEventTrigger(server, 'A player joins the server for the first time').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed user first join trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for user join
				Logger.info(`Removing user join and leave triggers for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A player joins the server', 'MakePOSTRequest');
				await removeTaskFromTrigger(server, 'A player joins the server', 'SendConsole');
				await removeEventTrigger(server, 'A player joins the server').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed user join trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for user leave
				Logger.info(`Removing user leave trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A player leaves the server', 'MakePOSTRequest');
				await removeTaskFromTrigger(server, 'A player leaves the server', 'SendConsole');
				await removeEventTrigger(server, 'A player leaves the server').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed user leave trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for app state
				Logger.info(`Removing app state trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'The application state changes', 'MakePOSTRequest');
				await removeTaskFromTrigger(server, 'The application state changes', 'IfCondition');
				await removeEventTrigger(server, 'The application state changes').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed app state trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for backups
				Logger.info(`Removing backup start trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'A backup has started.', 'MakePOSTRequest');
				await removeEventTrigger(server, 'A backup has started.').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed backup start trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});
				await removeTaskFromTrigger(server, 'A backup finishes archiving.', 'MakePOSTRequest').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed backup finish trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for crashes
				Logger.info(`Removing crash triggers for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'The Minecraft Server watchdog forced a shutdown (server unresponsive)', 'MakePOSTRequest');
				await removeEventTrigger(server, 'The Minecraft Server watchdog forced a shutdown (server unresponsive)').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed crash trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				await removeTaskFromTrigger(server, 'The Minecraft Server stops unexpectedly', 'MakePOSTRequest');
				await removeEventTrigger(server, 'The Minecraft Server stops unexpectedly').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed crash trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				});

				//! Remove the triggers and tasks for server lagging
				Logger.info(`Removing server lagging trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
				await removeTaskFromTrigger(server, 'The Minecraft server is unable to keep up', 'MakePOSTRequest');
				await removeTaskFromTrigger(server, 'The Minecraft server is unable to keep up', 'IfCondition');
				await removeEventTrigger(server, 'The Minecraft server is unable to keep up').then((e) => {
					if (!e.success) return Logger.error(e.desc);
					Logger.success(`Removed server lagging trigger for ${friendlyName} from ${channel.name} in ${interaction.guild.name}`);
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

			await interaction.followUp({ content: `Chat link removed for ${friendlyName} from <#${channel.id}>.`, flags: MessageFlags.Ephemeral });
			Logger.success('Chat link successfully removed!');
		}
	},
};
