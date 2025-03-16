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

		// Define Arrays
		const successfulAdditions = [];
		const failedAdditions = [];
		const successfulRemovals = [];
		const failedRemovals = [];

		// Define the list of jobs for the command to run
		const jobList = [
			{
				eventName: 'A player sends a chat message',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@User}',
								MESSAGE: '{@Message}',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A player joins the server for the first time',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@User}',
								MESSAGE: 'joined for the first time',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
					{
						taskName: 'SendConsole',
						dictionary: {
							Input: 'playsound minecraft:block.bell.resonate player @a 0 0 0 1 2 0.25',
						},
						allowDuplicates: true,
					},
					{
						taskName: 'SendConsole',
						dictionary: {
							Input: 'tellraw @p ["",{"text":"Welcome ","color":"gold"},{"text":"to the server","color":"aqua"},", ",{"text":"{@User}","color":"green"},"!"]',
						},
						allowDuplicates: true,
					},
				],
			},
			{
				eventName: 'A player joins the server',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@User}',
								MESSAGE: 'has connected',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
					{
						taskName: 'SendConsole',
						dictionary: {
							Input: 'playsound minecraft:block.conduit.activate player @a 0 0 0 1 2 0.25',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A player leaves the server',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@User}',
								MESSAGE: 'has disconnected',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A player is killed by an NPC',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@Victim}',
								MESSAGE: 'was {@Method} by **{@Attacker}**',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A player is killed by another player',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@Victim}',
								MESSAGE: 'was {@Method} by **{@Attacker}**',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A player achieves an advancement',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: '{@User}',
								MESSAGE: 'has made the advancement **{@Advancement}**',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'The application state changes',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'IfCondition',
						dictionary: {
							ValueToCheck: '{@State}',
							Operation: '3',
							ValueToCompare: 'Pre',
						},
						allowDuplicates: false,
					},
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: '{@State}',
								INSTANCE: '{@InstanceId}',
								START: '{@StartTime}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A backup has started.',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: 'A Backup has started',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'A backup finishes archiving.',
				dontRemove: true,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: 'A Backup has finished archiving',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,

						reorderTask: -5,
					},
				],
			},
			{
				eventName: 'The Minecraft Server watchdog forced a shutdown (server unresponsive)',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: 'Server is unresponsive and has been terminated',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'The Minecraft Server stops unexpectedly',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: "I've crashed",
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
			{
				eventName: 'The Minecraft server is unable to keep up',
				dontRemove: false,
				tasksToAdd: [
					{
						taskName: 'IfCondition',
						dictionary: {
							ValueToCheck: '{@TicksSkipped}',
							Operation: '4',
							ValueToCompare: '300',
						},
						allowDuplicates: false,
					},
					{
						taskName: 'MakePOSTRequest',
						dictionary: {
							URI: `${process.env.SRV_API}/v1/server/link`,
							Payload: JSON.stringify({
								USER: 'SERVER',
								MESSAGE: 'I seem to be lagging, {@MillisecondsBehind}ms or {@TicksSkipped} ticks behind',
								INSTANCE: '{@InstanceId}',
								EVENT: '{@TriggerName}',
							}),
							ContentType: 'application/json',
						},
						allowDuplicates: false,
					},
				],
			},
		];

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

			// Add the triggers and tasks for the server
			for await (const { eventName, tasksToAdd } of jobList) {
				// Add event to the server
				await addEventTrigger(server, eventName).then((e) => {
					if (!e.success) {
						// Skip the backup finishes archiving event as it's always present
						if (e.eventName === 'A backup finishes archiving.') return;
						failedAdditions.push({ eventName, desc: e.desc });
						return;
					}
					successfulAdditions.push({ eventName });
				});

				// Add tasks to the event
				for await (const { taskName, dictionary, allowDuplicates, reorderTask } of tasksToAdd) {
					await addTaskToTrigger(server, eventName, taskName, dictionary, allowDuplicates).then((e) => {
						if (!e.success) return failedAdditions.push({ eventName, taskName, desc: e.desc });
						successfulAdditions.push({ eventName, taskName });
					});
					// Change the order of the task if needed
					if (!reorderTask) continue;
					await changeTaskOrder(server, eventName, taskName, reorderTask);
				}
			}

			// Return number of successful and failed additions
			Logger.info(`${successfulAdditions.length} triggers successfully added\n${failedAdditions.length} triggers failed to add`);
			if (failedAdditions.length > 0) {
				Logger.error('Failed triggers:');
				failedAdditions.forEach((f) => Logger.error(f));
			}

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

			await interaction.followUp({
				content: `Chat link set for ${friendlyName} in <#${channel.id}>.\nSuccessful Additions: ${successfulAdditions.length}\nFailed Additions: ${failedAdditions.length}`,
				flags: MessageFlags.Ephemeral,
			});
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
				// Remove the tasks and events for the server
				for await (const { eventName, dontRemove, tasksToAdd } of jobList) {
					// Remove tasks from the event
					for await (const { taskName } of tasksToAdd) {
						await removeTaskFromTrigger(server, eventName, taskName).then((e) => {
							if (!e.success) return failedRemovals.push({ eventName, taskName, desc: e.desc });
							successfulRemovals.push({ eventName, taskName });
						});
					}

					// Remove the event from the server
					if (dontRemove) continue;
					await removeEventTrigger(server, eventName).then((e) => {
						if (!e.success) return failedRemovals.push({ eventName, desc: e.desc });
						successfulRemovals.push({ eventName });
					});
				}

				// Return number of successful and failed removals
				Logger.info(`${successfulRemovals.length} triggers successfully removed\n${failedRemovals.length} triggers failed to remove`);
				if (failedRemovals.length > 0) {
					Logger.error('Failed triggers:');
					failedRemovals.forEach((f) => Logger.error(f));
				}
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

			await interaction.followUp({
				content: `Chat link removed for ${friendlyName} from <#${channel.id}>\nSuccessful Removals: ${successfulRemovals.length}\nFailed Removals: ${failedRemovals.length}`,
				flags: MessageFlags.Ephemeral,
			});
			Logger.success('Chat link successfully removed!');
		}
	},
};
