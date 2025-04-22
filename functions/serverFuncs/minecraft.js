function calculateSleepingPercentage(onlinePlayers, maxPlayers) {
	if (maxPlayers <= 0 || onlinePlayers <= 0) return { sleepPercentage: 50, requiredToSleep: 0 };
	if (onlinePlayers <= 1) return { sleepPercentage: 50, requiredToSleep: 1 };

	const rawPercentage = 50 * (1 - Math.pow(onlinePlayers / maxPlayers, 2));
	const cappedPercentage = Math.min(50, Math.max(25, rawPercentage));
	const roundedPercentage = Math.round(cappedPercentage / 5) * 5;
	const required = Math.max(1, Math.ceil((roundedPercentage / 100) * onlinePlayers));

	return { sleepPercentage: roundedPercentage, requiredToSleep: required };
}

async function updateTypingScoreboard(channel, client, sendConsoleMessage, API) {
	const typingUsers = [...client.typingState.values()].filter((entry) => entry.channel.id === channel.id).map((entry) => entry.user);

	const names = await Promise.all(
		typingUsers.map(async (user) => {
			const member = channel.guild ? await channel.guild.members.fetch(user.id).catch(() => null) : null;
			return member?.displayName || user.username;
		})
	);

	const userCount = names.length;

	// If no users are typing, set display text to an empty string
	let displayText = userCount === 0 ? '' : userCount === 1 ? `${names[0]} is typing...` : `${userCount} users are typing...`;

	// If text exceeds 32 characters, show the user count instead
	if (displayText.length > 32) {
		displayText = `${userCount} users are typing...`;
	}

	// Determine which scoreboard display to set based on user count
	const displayCommand = userCount === 0 ? 'scoreboard objectives setdisplay sidebar' : 'scoreboard objectives setdisplay sidebar chatlink_typing';

	// Send the display update command to Discord
	await sendConsoleMessage(API, displayCommand);

	// Send the updated scoreboard message
	const scoreboardText = `{"text": "${displayText}"}`;
	await sendConsoleMessage(API, `scoreboard objectives modify chatlink_typing displayname ${scoreboardText}`);
}

module.exports = {
	updateTypingScoreboard,
};

module.exports = {
	calculateSleepingPercentage,
	updateTypingScoreboard,
};
