const express = require('express');
const router = express.Router();

const instances = require('./routes/instances');
const statistics = require('./routes/statistics');
const playerheads = require('./routes/playerheads');
const link = require('./routes/link');
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
router.use(link);
router.use(ai);

module.exports = (client) => {
	router.client = client;
	return router;
};
