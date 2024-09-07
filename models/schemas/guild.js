const { Schema, model } = require('mongoose');

const chatLinkSchema = Schema({
	webhookId: {
		type: String,
		required: true,
	},
	webhookToken: {
		type: String,
		required: true,
	},
	instanceFriendlyName: {
		type: String,
		required: true,
	},
	instanceId: {
		type: String,
		required: true,
	},
	channelId: {
		type: String,
		required: true,
	},
});

const guildSchema = Schema({
	// ID's
	guildId: {
		type: String,
		required: true,
	},
	chatLinks: [chatLinkSchema],
});

module.exports = model('Guild', guildSchema);
