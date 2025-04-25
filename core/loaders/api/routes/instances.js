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
				const meta = buildMeta(instance);
				res.render('status', { instances: [instance], meta });
			} else {
				res.status(404).send('Instance not found');
			}
		} else {
			const meta = buildMeta();
			res.render('status', { instances: data.instances, meta });
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
	if (instanceId) {
		const instance = data.instances.find((i) => i.instanceId === instanceId);
		if (instance) {
			res.json({ ...data, instances: [instance] });
		} else {
			res.status(404).send('Instance not found');
		}
	} else {
		res.json(data);
	}
});

// Meta builder
function buildMeta(instance) {
	// Build description
	const state = instance?.server ? instance.server.state : '';
	const cpuUsage = instance?.server.cpu ? `CPU Usage: ${instance.server.cpu.Percent}%` : '';
	const memoryUsage = instance?.server.memory ? `Memory Usage: ${(instance.server.memory.RawValue / 1024).toFixed(2)}/${(instance.server.memory.MaxValue / 1024).toFixed(0)}GB` : '';
	const performance = instance?.server.performance ? `${instance.server.performance.Unit}: ${instance.server.performance.RawValue}` : '';
	const userCount = instance?.server.users ? `Users: ${instance.server.users.RawValue}/${instance.server.users.MaxValue}` : '';

	const builtDescription = instance
		? `${instance.friendlyName} - ${state}\n${cpuUsage}\n${memoryUsage}\n${performance}\n${userCount}`
		: 'W.I.P Page to view the status of my servers.';

	return {
		title: instance ? `VoxelServers - ${instance.friendlyName}` : 'VoxelServers - Server Statuses',
		description: builtDescription || 'W.I.P Page to view the status of my servers.',
		image: (instance && instance.icon) || '/v1/static/images/logos/SrvLogoAlt.png',
	};
}

module.exports = router;
