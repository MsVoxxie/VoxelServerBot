const express = require('express');
const router = express.Router();

const instances = require('./routes/instances');
const statistics = require('./routes/statistics');
const playerheads = require('./routes/playerheads');
const network = require('./routes/network');
const link = require('./routes/link');
const auth = require('./routes/auth');
const chat = require('./routes/chat');
const ai = require('./routes/ai');

// Middleware to inject client into request
router.use((req, res, next) => {
	req.client = router.client;
	next();
});

// Use modular routes

router.use(instances);
router.use(statistics);
router.use(playerheads);
router.use(network);
router.use(link);
router.use(auth);
router.use(chat);
router.use(ai);

module.exports = (client) => {
	router.client = client;
	return router;
};
