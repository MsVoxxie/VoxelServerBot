function calculateSleepingPercentage(onlinePlayers, maxPlayers) {
	if (maxPlayers <= 0 || onlinePlayers <= 0) return 100;
	if (onlinePlayers <= 1) return 100;

	const rawPercentage = 100 * (1 - Math.pow(onlinePlayers / maxPlayers, 1.5));
	const cappedPercentage = Math.max(25, rawPercentage);
	return Math.round(cappedPercentage / 5) * 5;
}

module.exports = {
	calculateSleepingPercentage,
};
