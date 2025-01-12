const { saveEvent } = require('../../../functions/helpers/saveEvents');
const Logger = require('../../../functions/logging/logger');
// const RateLimit = require('express-rate-limit');
const { botData } = require('../../../models');
const router = require('./router');
const Port = process.env.API_PORT;
const moment = require('moment');
require('moment-duration-format');
const { join } = require('path');
const e = require('express');
const cors = require('cors');
const srv = e();

module.exports = (client) => {
	// Rate Limit | Unused
	// const limiter = RateLimit({
	// 	windowMs: 1 * 60 * 1000,
	// 	max: 5,
	// });

	// Set Proxy
	srv.set('trust proxy', process.env.API_PROXY);

	// srv.use(limiter);
	srv.use(cors());
	srv.use(e.json());
	srv.use('/', router);

	// Get the static data
	const staticPath = join(__dirname, '../../../images');

	// Send the static data
	srv.use('/v1/client/static', e.static(staticPath));
	// Statistics Route
	srv.get('/v1/client/statistics', async (req, res) => {
		const databaseData = await botData.findOne({});
		client.clientData = {
			SESSION: {
				SESSION_COUNT: databaseData.session,
				UPTIME: moment.duration(client.uptime).format('Y[Y] M[M] W[W] D[D] H[h] m[m] s[s]'),
				START_TIME: databaseData.startTime,
				START_TIME_UTC: databaseData.startTimeUTC,
			},
			CLIENT: {
				STATUS: 'ONLINE',
				DISCORD_API_LATENCY: `${Math.round(client.ws.ping)}ms`,
				CLIENT_MEMORY_USAGE: formatMemoryUsage(process.memoryUsage().heapUsed),
			},
			HANDLERS: {
				COMMANDS: {
					TOTAL_COMMANDS: client.commands.size,
				},
				EVENTS: {
					TOTAL_EVENTS: client.events.size,
				},
			},
		};
		res.send(client.clientData);
	});

	// Receive Messages
	srv.post('/v1/server/link', async (req, res) => {
		// Escape any incoming quotes
		req.body.MESSAGE.replace(/\"/g, '\\"');

		// Log the body for debugging
		if (client.debug) {
			Logger.info(req.body);
		}

		// Pull the EVENT type from the body and strip it down to the event name
		const rawEvent = req.body.EVENT;
		const splitEvent = rawEvent.split('.')[2];
		// Make the first letter lowercase to match my standard
		const formattedEvent = splitEvent.charAt(0).toLowerCase() + splitEvent.slice(1);

		// Emit the event
		client.emit(formattedEvent, {
			USER: req.body.USER,
			MESSAGE: req.body.MESSAGE,
			INSTANCE: req.body.INSTANCE,
			EVENT: formattedEvent,
			START: req.body.START || null,
		});

		// Generic Event Emitter -- To be deprecated
		client.emit('receivedChat', req.body);
		res.status(200).send({ message: 'Success!' });

		// Save the event to the database, This is entirely because im forgetful :)
		await saveEvent(formattedEvent);
	});

	// Receive AI Requests
	srv.post('/v1/server/ai', async (req, res) => {
		client.emit('receivedAi', req.body);
		res.status(200).send({ message: 'Success!' });
	});

	srv.listen(Port, () => {
		Logger.success(`API Running on port ${Port}`);
	});
};

const formatMemoryUsage = (data) => `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
