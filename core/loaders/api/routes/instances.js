const { getStatusPageData } = require('../../../../functions/ampAPI/instanceFunctions');
const express = require('express');
const router = express.Router();

router.get('/v1/servers', async (req, res) => {
	try {
		const data = await getStatusPageData();
		res.render('status', { instances: data.instances });
		// res.json(data);
	} catch (err) {
		console.error(err);
		res.status(404).send('Failed to get server instances');
	}
});

router.get('/v1/server/servers', async (req, res) => {
	const data = await getStatusPageData();
	res.json(data);
});

module.exports = router;
