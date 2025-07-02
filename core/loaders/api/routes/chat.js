const { sendConsoleMessage } = require('../../../../functions/ampAPI/apiFunctions');
const express = require('express');
const { serverLink } = require('../../../../functions/helpers/messageDiscord');
const { queueTask } = require('../../../../functions/helpers/queueTask');
const router = express.Router();

// From the website to the game server
router.post('/v1/server/client_to_server', async (req, res) => {
	const authHeader = req.headers['authorization'];
	if (authHeader !== `Bearer ${process.env.API_SECRET}`) return res.status(401).send('Unauthorized');
	res.status(200).send({ message: 'sucess' });
	const { user, instance, message, serverGame } = req.body;

	// switch the serverGame to the correct instance module
	switch (serverGame) {
		case 'Minecraft':
			await sendConsoleMessage(
				instance,
				`tellraw @a ["",{"text":"[Web] ","color":"blue","hoverEvent":{"action":"show_text","contents":[{"text":"Web","color":"blue"}]}},{"text":"<"},{"text":"${user}","color":"orange"},{"text":"> "},{"text":"${message}","italic":false}]`
			);

			// Play a sound to get the attention of the players but randomize the pitch with a minimum of 0.8 and a maximum of 1.3
			const pitch = Math.random() * (1.3 - 0.8) + 0.8;
			await sendConsoleMessage(instance, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${pitch} 0.25`);
			break;

		default:
			await sendConsoleMessage(instance, `say "[Web] ${user}: ${message}"`);
			break;
	}
	queueTask(instance, serverLink, user, null, `[Web] ${message}`, instance);
});

module.exports = router;
