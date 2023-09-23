const Logger = require('../../../functions/logging/logger');
const RateLimit = require('express-rate-limit');
const { botData } = require('../../../models');
const bodyParser = require('body-parser');
const router = require('./router');
const Port = process.env.API_PORT;
const moment = require('moment');
require('moment-duration-format');
const { join } = require('path');
const e = require('express');
const cors = require('cors');
const srv = e();

module.exports = (client) => {
	// Rate Limit
	const limiter = RateLimit({
		windowMs: 1 * 60 * 1000,
		max: 5,
	});

	// Set Proxy
	srv.set('trust proxy', process.env.API_PROXY);

	// JSON Parser
	const jsonParser = bodyParser.json();

	// Set "Use"
	// srv.use(limiter);
	srv.use(cors());
	srv.use(jsonParser);
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
		client.emit('receivedChat', req.body);
		res.status(200).send({ message: 'Success!' });
	});

	srv.listen(Port, () => {
		Logger.success(`API Running on port ${Port}`);
	});
};

const formatMemoryUsage = (data) => `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
