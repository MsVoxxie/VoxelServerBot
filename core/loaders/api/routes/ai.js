const express = require('express');
const router = express.Router();

router.post('/v1/server/ai', (req, res) => {
	const client = req.client;
	client.emit('receivedAi', req.body);
	res.status(200).send({ message: 'Success!' });
});

module.exports = router;
