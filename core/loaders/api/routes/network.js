const express = require('express');
const router = express.Router();

router.get('/v1/server/network', (req, res) => {
	const { network } = require('../../../../core/loaders/networkLoader');
	res.status(200).send(network);
});

module.exports = router;
