function splitSentence(input, maxLength) {
	if (input.length <= maxLength) return [input];

	const parts = [];
	let currentPart = '';

	input.split(' ').forEach((word) => {
		// If adding the next word exceeds the max length
		if (currentPart.length + word.length + 1 > maxLength) {
			parts.push(currentPart.trim());
			currentPart = word; // Start a new part with the current word
		} else {
			currentPart += (currentPart ? ' ' : '') + word; // Append word to the current part
		}
	});

	// Push the last part if it's non-empty
	if (currentPart.trim().length > 0) {
		parts.push(currentPart.trim());
	}

	return parts;
}

async function alertSoundMC(instanceId, type = 'notice' || 'alert') {
	// Require the sendConsoleMessage function
	const { sendConsoleMessage } = require('../ampAPI/apiFunctions');

	// Randomized variance added to the pitch, max of 0.2 and min of 0.1
	const pitch = Math.random() * (0.2 - 0.1) + 0.1;

	switch (type) {
		case 'alert':
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${0.75 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 100));
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1 + pitch} 0.25`);
			break;

		case 'notice':
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1.8 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1.8 + pitch} 0.25`);
			await new Promise((resolve) => setTimeout(resolve, 50));
			await sendConsoleMessage(instanceId, `playsound minecraft:block.note_block.pling player @a 0 0 0 1 ${1.3 + pitch} 0.25`);

		default:
			return;
	}
}

module.exports = {
	splitSentence,
	alertSoundMC,
};
