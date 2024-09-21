const { updateDatabaseInstances } = require('../../functions/ampAPI/updateDatabase');

module.exports = {
	name: 'oneMinute',
	runType: 'infinity',
	async execute(client) {
		// Update the database with the instances
		await updateDatabaseInstances();
	},
};
