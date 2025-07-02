const express = require('express');
const { sendConsoleMessage } = require('../../../../functions/ampAPI/apiFunctions');
const router = express.Router();

// From the website to the game server
router.post('/v1/server/client_to_server', async (req, res) => {
	const authHeader = req.headers['authorization'];
	if (authHeader !== `Bearer ${process.env.API_SECRET}`) return res.status(401).send('Unauthorized');
	res.status(200).send({ message: 'sucess' });
	console.log(req.body);
	
	const { user, instance, message } = req.body;

	// Send off to server
	console.log(`Sending message to ${instance}: ${message}`);

	await sendConsoleMessage(instance, `say ${user}: ${message}`);
});

module.exports = router;
