const { SlashCommandBuilder } = require('discord.js');
const { fetchTriggerTaskId, fetchTaskId } = require('../../functions/ampAPI/apiFunctions');
module.exports = {
	data: new SlashCommandBuilder().setName('triggers').setDescription('Test the trigger functions'),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const server = '68574cfd-53da-4d0b-8558-d00b791b3bc7';

		const test = await fetchTriggerTaskId(server, 'A player sends a chat message', 'MakePOSTRequest');

		console.log(test);
		
		return;

		const triggerID = await fetchTaskId(server, 'MakePOSTRequest');
		await serverInstance.Core.DeleteTaskAsync(chatMessageTrigger.Id, postRequestEvent.Id).then((t) => console.log(t));

		console.log(triggerID);
	},
};
