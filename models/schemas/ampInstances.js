const { Schema, model } = require('mongoose');

const instanceSchema = Schema({
	// ID's
	instanceId: {
		type: String,
		required: true,
	},
	// Instance information
	instanceRunning: {
		type: Boolean,
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
	instanceDisplaySource: {
		type: String,
		required: true,
	},
	instanceSuspended: {
		type: Boolean,
		default: false,
	},
	applicationPort: {
		type: Number,
		required: true,
	},
	minecraftVersion: {
		type: String,
		required: false,
	},
});

const ampInstanceSchema = Schema({
	instances: [instanceSchema],
});

module.exports = model('AmpInstance', ampInstanceSchema);
