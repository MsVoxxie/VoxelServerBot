function calculateSleepingPercentage(onlinePlayers, maxPlayers) {
	if (maxPlayers <= 0 || onlinePlayers <= 0) return 100;
	if (onlinePlayers <= 1) return 100;
	return Math.max(25, Math.round(100 * (1 - Math.pow(onlinePlayers / maxPlayers, 1.5))));
}

module.exports = {
	calculateSleepingPercentage,
};
