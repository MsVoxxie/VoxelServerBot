const { Schema, model } = require('mongoose');

const guildSchema = Schema({
	// ID's
	guildId: {
		type: String,
		required: true,
	},
	chatlinkWebhook: {
		url: {
			type: String,
			required: true,
		},
		channelId: {
			type: String,
			required: true,
		},
	},
});

module.exports = model('Guild', guildSchema);
