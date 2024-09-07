const { SlashCommandBuilder } = require('discord.js');
const { mainAPI } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	data: new SlashCommandBuilder().setName('get_instances').setDescription("Get Server Instance ID's"),
	options: {
		devOnly: true,
		disabled: false,
	},
	async execute(client, interaction, settings) {
		const API = await mainAPI();
		// Init API Instances
		const instancesResult = await API.ADSModule.GetLocalInstancesAsync();
		const friendlyInstances = instancesResult.map((i) => {
			const friendly = {
				InstanceName: i.InstanceName,
				FriendlyName: i.FriendlyName,
				InstanceID: i.InstanceID,
				Port: i.Port,
			};
			return friendly;
		});
		console.log(friendlyInstances);
	},
};
