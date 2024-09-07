const { Schema, model } = require('mongoose');

const guildSchema = Schema({
	guildId: {
		type: String,
		required: true,
	},
});

module.exports = model('guild', guildSchema);
