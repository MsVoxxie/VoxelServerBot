const express = require('express');
const router = express.Router();

router.get('/v1/server/network', (req, res) => {
	const { network } = require('../../../../core/loaders/networkLoader');
	res.status(200).send(network);
});

router.get('/v1/server/ping', (req, res) => {
	res.status(200).send('pong!');
});

module.exports = router;
