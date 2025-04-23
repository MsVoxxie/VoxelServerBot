const express = require('express');
const cors = require('cors');
const { join } = require('path');
const Logger = require('../../../functions/logging/logger');
const Port = process.env.API_PORT;
const routeLoader = require('./router');

const srv = express();

module.exports = (client) => {
	srv.set('trust proxy', process.env.API_PROXY);
	srv.set('view engine', 'ejs'); // 👈 EJS
	srv.set('views', join(__dirname, '../api/views'));

	srv.use(cors());
	srv.use(express.json());
	srv.use('/v1/static', express.static(join(__dirname, '../api/public')));

	// API routes
	srv.use('/', routeLoader(client));

	srv.listen(Port, () => {
		Logger.success(`API + Status Page running on port ${Port}`);
	});
};
