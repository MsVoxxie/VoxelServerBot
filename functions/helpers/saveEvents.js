const { eventList } = require('../../models/index');

async function saveEvent(formattedEvent, rawEvent) {
	try {
		const result = await eventList.findOneAndUpdate({}, { $addToSet: { events: formattedEvent, rawEvents: rawEvent } }, { upsert: true, new: true });

		// Sort the events array because its pretty :)
		result.events = result.events.sort();
		await result.save();

		// Return the result
		return result;
	} catch (error) {
		return error;
	}
}

module.exports = {
	saveEvent,
};
