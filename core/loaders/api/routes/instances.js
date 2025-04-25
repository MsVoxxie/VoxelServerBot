const { getStatusPageData } = require('../../../../functions/ampAPI/instanceFunctions');
const express = require('express');
const router = express.Router();

// This route is for the status page
router.get('/v1/servers/:instanceId?', async (req, res) => {
	try {
		const data = await getStatusPageData();
		if (req.params.instanceId) {
			const instance = data.instances.find((i) => i.instanceId === req.params.instanceId);
			if (instance) {
				res.render('status', { instances: [instance] });
			} else {
				res.status(404).send('Instance not found');
			}
		} else {
			res.render('status', { instances: data.instances });
		}
	} catch (err) {
		console.error(err);
		res.status(404).send('Failed to get server instances');
	}
});

// This route is for the API to grab the instance data
router.get('/v1/server/data/instances/:instanceId?', async (req, res) => {
	const { instanceId } = req.params;
	const data = await getStatusPageData();

	// Ensure instances is always an array, even when querying a single instance
	if (instanceId) {
		const instance = data.instances.find((i) => i.instanceId === instanceId);
		if (instance) {
			// Return the full data object with instances as an array (even for single instance)
			res.json({ ...data, instances: [instance] });
		} else {
			res.status(404).send('Instance not found');
		}
	} else {
		// No instanceId provided, return the full data object with instances array
		res.json(data); // Return the full data object, including all instances
	}
});

module.exports = router;
