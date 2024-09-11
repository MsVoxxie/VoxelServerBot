const { SlashCommandBuilder } = require('discord.js');
const { addEventTrigger, addTaskToTrigger, removeEventTrigger, removeTaskFromTrigger } = require('../../functions/ampAPI/eventFunctions');
module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const instanceId = '5f0dc49e-0a5b-4198-b17b-e8c3ff56b519';
		const triggerDescription = 'A player sends a chat message';
		const taskName = 'MakePOSTRequest';

		// const taskData = {
		// 	URI: `${process.env.SRV_API}/v1/server/link`,
		// 	Payload: JSON.stringify({ USER: '{@InstanceName}', MESSAGE: 'Server {@State}', INSTANCE: '{@InstanceId}' }),
		// 	ContentType: 'application/json',
		// };

		// await addEventTrigger(instanceId, 'The application state changes');
		// await addTaskToTrigger(instanceId, 'The application state changes', 'IfCondition', { ValueToCheck: '{@State}', Operation: '3', ValueToCompare: 'Pre' });
		// await addTaskToTrigger(instanceId, 'The application state changes', 'MakePOSTRequest', taskData);
	},
};
