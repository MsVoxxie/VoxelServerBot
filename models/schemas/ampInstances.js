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
	instanceSuspended: {
		type: Boolean,
		default: false,
	},
	instancePort: {
		type: Number,
		required: true,
	},
});

const ampInstanceSchema = Schema({
	instances: [instanceSchema],
});

module.exports = model('AmpInstance', ampInstanceSchema);
