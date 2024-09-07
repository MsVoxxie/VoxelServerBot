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
	instanceModule: {
		type: String,
		required: true,
	},
	instanceName: {
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

const chatLinkSchemas = Schema({
	chatLinks: [chatLinkSchema],
});

module.exports = model('chatLinks', chatLinkSchemas);
