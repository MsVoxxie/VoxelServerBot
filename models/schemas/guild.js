const { Schema, model } = require('mongoose');

const chatLinkSchema = Schema({
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
