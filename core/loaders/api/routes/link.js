const express = require('express');
const { saveEvent } = require('../../../../functions/helpers/saveEvents');
const Logger = require('../../../../functions/logging/logger');
const router = express.Router();

router.post('/v1/server/link', async (req, res) => {
	const client = req.client;

	req.body.MESSAGE = req.body.MESSAGE.replace(/\"/g, '\\"');

	if (client.debug) {
		Logger.info(req.body);
	}

	const rawEvent = req.body.EVENT;
	const splitEvent = rawEvent.split('.')[2];
	const formattedEvent = splitEvent.charAt(0).toLowerCase() + splitEvent.slice(1);

	client.emit(formattedEvent, {
		USER: req.body.USER,
		MESSAGE: req.body.MESSAGE.replace(/\s+/g, ' '),
		INSTANCE: req.body.INSTANCE,
		EVENT: formattedEvent,
		START: req.body.START || null,
	});

	client.emit('receivedChat', req.body);

	await saveEvent(formattedEvent);

	res.status(200).send({ message: 'Success!' });
});

module.exports = router;
