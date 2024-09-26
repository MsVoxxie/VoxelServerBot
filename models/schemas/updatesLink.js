const { Schema, model } = require('mongoose');

const updatesLinkSchema = Schema({
	webhookId: {
		type: String,
		required: true,
	},
	webhookToken: {
		type: String,
		required: true,
	},
	guildId: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
	},
});

module.exports = model('updatesLink', updatesLinkSchema);
