const { serverLink } = require('../../functions/helpers/messageDiscord');

// Track users that have received a join message
const userJoinedSet = new Set();

// Clear the set every 10 seconds
const clearInt = 10 * 1000;
setInterval(() => {
	userJoinedSet.clear();
}, clearInt);

module.exports = {
	name: 'receivedChat',
	runType: 'infinity',
	async execute(client, data) {
		let message = data.MESSAGE;

		// If the USER is SERVER and the MESSAGE is Ready, Let's get the time it took to start the server
		if (data.USER === 'SERVER' && data.MESSAGE === 'Ready') {
			const serverStart = client.serverStartTime(data.START);
			message = `Ready, took ${serverStart}`;
		}

		// Allow only the first join message to be sent for each user //! This Sucks
		if (data.MESSAGE === 'has connected' || data.MESSAGE === 'joined for the first time') {
			if (userJoinedSet.has(data.USER)) {
				return;
			} else {
				userJoinedSet.add(data.USER);
			}
		}

		// Send webhook
		await serverLink(data.USER, message, data.INSTANCE);
	},
};
