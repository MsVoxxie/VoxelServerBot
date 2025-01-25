function calculateSleepingPercentage(onlinePlayers, maxPlayers) {
	// If there are no players, return 100%
	if (maxPlayers <= 0 || onlinePlayers <= 0) return { sleepPercentage: 100, requiredToSleep: 0 };
	if (onlinePlayers <= 1) return { sleepPercentage: 100, requiredToSleep: 1 };

	// Calculate the percentage of players sleeping and round to the nearest 5
	const rawPercentage = 100 * (1 - Math.pow(onlinePlayers / maxPlayers, 0.8));
	const cappedPercentage = Math.max(25, rawPercentage);
	const roundedPercentage = Math.floor(cappedPercentage / 5) * 5;

	// Get the required number of players to sleep based on the percentage
	const required = Math.ceil((roundedPercentage / 100) * onlinePlayers);

	return { sleepPercentage: roundedPercentage, requiredToSleep: required };
}

module.exports = {
	calculateSleepingPercentage,
};
