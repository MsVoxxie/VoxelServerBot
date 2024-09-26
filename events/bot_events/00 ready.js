const moment = require('moment');
const { Events } = require('discord.js');
const { botData } = require('../../models');
const Logger = require('../../functions/logging/logger');
const { updateDatabaseInstances } = require('../../functions/ampAPI/updateDatabase');

module.exports = {
	name: Events.ClientReady,
	runType: 'single',
	async execute(client) {
		Logger.success(`Ready! Logged in as ${client.user.tag}`);
		client.mongoose.init();

		// Bot data
		await botData.findOneAndUpdate(
			{},
			{ clientId: client.user.id, startTime: moment().format('MMMM Do YYYY, h:mm A'), startTimeUTC: Date.now(), $inc: { session: 1 } },
			{ upsert: true }
		);

		// Update the database with the instances
		const { instanceCount, allInstances } = await updateDatabaseInstances();
		client.totalInstances = instanceCount;
		client.oldInstances = allInstances;
	},
};
