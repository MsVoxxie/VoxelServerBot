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

// Handle crash counter
function handleCrashCounter(client, instanceId, augmentedMessage) {
	// Increment the crash count for the instance
	if (!client.crashCount.has(instanceId)) {
		client.crashCount.set(instanceId, 0);
	}
	let crashCount = client.crashCount.get(instanceId);
	client.crashCount.set(instanceId, crashCount + 1);
	crashCount = client.crashCount.get(instanceId);
	let augment = '';

	const messages = [
		` [${crashCount}] We'll be right back!`,
		` [${crashCount}] Hopefully this is temporary?`,
		` [${crashCount}] ...Well, crap?`,
		` [${crashCount}] Yell at <@101789503634554880> to fix it...`,
		` [${crashCount}] <@101789503634554880> We've got a problem!`,
	];
	const index = Math.min(crashCount - 1, messages.length - 1);
	augment = messages[index >= 0 ? index : 0];
	return augmentedMessage + `\n-# ${augment}`;
}

module.exports = {
	splitSentence,
	alertSoundMC,
	handleCrashCounter,
};
