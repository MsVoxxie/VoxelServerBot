const { Schema, model } = require('mongoose');

const guildSchema = Schema({
	// ID's
	guildId: {
		type: String,
		required: true,
	},
});

module.exports = model('Guild', guildSchema);
