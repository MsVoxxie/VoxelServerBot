const { SlashCommandBuilder } = require('discord.js');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/eventFunctions');
module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceId = 'c0545cf8-0e24-4779-8f4b-8383516723d4';
		const triggerDescription = 'A player sends a chat message';
		const taskName = 'MakePOSTRequest';
		const taskData = {
			URI: `${process.env.SRV_API}/v1/server/link`,
			Payload: JSON.stringify({ USER: '{@User}', MESSAGE: '{@Message}', INSTANCE: '{@InstanceId}' }),
			ContentType: 'application/json',
		};

		// await addEventTrigger(instanceId, triggerDescription).then((e) => console.log(e));
		// await addTaskToTrigger(instanceId, triggerDescription, taskName, taskData).then((e) => console.log(e));
		// await removeTaskFromTrigger(instanceId, triggerDescription, taskName).then((e) => console.log(e));
		// await removeEventTrigger(instanceId, triggerDescription).then((e) => console.log(e));
	},
};
