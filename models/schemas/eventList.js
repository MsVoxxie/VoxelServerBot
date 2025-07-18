const { Schema, model } = require('mongoose');

const eventSchema = Schema({
	events: { type: [String], default: [] },
	rawEvents: { type: [String], default: [] },
});

module.exports = model('EventCollection', eventSchema);
