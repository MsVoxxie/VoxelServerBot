const { serverLink } = require('../../functions/helpers/messageDiscord');
const { queueTask } = require('../../functions/helpers/queueTask');
const { sendToWeb } = require('../../functions/helpers/toWeb');

module.exports = {
	name: 'playerAdvancement',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		let { USER, INSTANCE, MESSAGE } = data;

		MESSAGE = MESSAGE.replace(
			'has made the advancement **Monster Hunter**',
			'has made the advancement **[Monster Hunter](https://vsb.voxxie.me/v1/static/images/monster_hunter.jpg)**'
		);

		// Send off the message to Discord
		queueTask(INSTANCE, serverLink, USER, MESSAGE, INSTANCE);
		try {
			sendToWeb(INSTANCE, USER, MESSAGE);
		} catch (error) {
			null;
		}
	},
};
