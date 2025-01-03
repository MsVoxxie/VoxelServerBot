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

module.exports = {
	splitSentence,
};
