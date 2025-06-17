const express = require('express');
const path = require('path');
const { getPlayerHead, getSteamAvatar } = require('../../../../functions/serverFuncs/cacheHeads');
const router = express.Router();

router.get('/v1/client/playerheads/:username', async (req, res) => {
	const { username } = req.params;
	try {
		const imagePath = await getPlayerHead(username);
		res.sendFile(path.resolve(imagePath));
	} catch (err) {
		console.error(err);
		res.status(404).send('Failed to get player head');
	}
});

router.get('/v1/client/steamhead/:steam64', async (req, res) => {
	const { steam64 } = req.params;
	try {
		const imagePath = await getSteamAvatar(steam64);
		res.sendFile(path.resolve(imagePath));
	} catch (err) {
		console.error(err);
		res.status(404).send('Failed to get Steam avatar');
	}
});

module.exports = router;
