const { serverLink } = require('../../functions/helpers/messageDiscord');

// Track users that have received a join message
const userJoinedSet = new Set();

// Clear the set every 10 seconds
const clearInt = 10 * 1000;
setInterval(() => {
	userJoinedSet.clear();
}, clearInt);

module.exports = {
	name: 'userJoins',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// Allow only the first join message to be sent for each user
		const joinMessages = ['has connected', 'joined for the first time'];

		if (joinMessages.includes(MESSAGE) && !userJoinedSet.has(USER)) {
			userJoinedSet.add(USER);
			// Send off the message to Discord
			await serverLink(USER, MESSAGE, INSTANCE);
			return;
		}
	},
};
