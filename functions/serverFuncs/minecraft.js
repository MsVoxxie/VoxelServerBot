function calculateSleepingPercentage(onlinePlayers, maxPlayers) {
	// If there are no players, return 100%
	if (maxPlayers <= 0 || onlinePlayers <= 0) return 100;
	if (onlinePlayers <= 1) return 100;

	// Calculate the percentage of players sleeping and round to the nearest 5
	const rawPercentage = 100 * (1 - Math.pow(onlinePlayers / maxPlayers, 1.5));
	const cappedPercentage = Math.max(25, rawPercentage);
	return Math.round(cappedPercentage / 5) * 5;
}

module.exports = {
	calculateSleepingPercentage,
};
