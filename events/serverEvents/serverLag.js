const { serverLink } = require('../../functions/helpers/messageDiscord');

const lastSent = new Map();

// Clear the last sent time every 15 minutes
setInterval(() => {
	lastSent.clear();
}, 900000);

module.exports = {
	name: 'serverLag',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Only allow this to be sent every 5 minutes
		if (lastSent.has(INSTANCE) && Date.now() - lastSent.get(INSTANCE) < 300000) return;
		// Send off the message to Discord
		await serverLink(USER, MESSAGE, INSTANCE, 'Alert', true);

		// Update the last sent time
		lastSent.set(INSTANCE, Date.now());
	},
};
