const { serverLink } = require('../../functions/helpers/messageDiscord');
const { instanceAPI, sendConsoleMessage } = require('../../functions/ampAPI/apiFunctions');

module.exports = {
	name: 'playerChats',
	runType: 'infinity',
	async execute(client, data) {
		// Split the data into variables
		const { USER, INSTANCE, MESSAGE } = data;

		// TPS Check command
		if (!MESSAGE.toLowerCase().includes('tps')) return;

		// Limit the command to only execute once to prevent invalid data, add a cooldown
		const cooldownKey = `tpsCheck_${INSTANCE}`;
		if (client.cooldowns.has(cooldownKey)) {
			const cooldownTime = client.cooldowns.get(cooldownKey);
			if (Date.now() < cooldownTime) return;
		}
		client.cooldowns.set(cooldownKey, Date.now() + 61 * 1000);

		// Remove the cooldown after 1 minute
		setTimeout(() => {
			client.cooldowns.delete(cooldownKey);
		}, 61 * 1000);

		// Get the instances type
		const API = await instanceAPI(INSTANCE);
		const instanceInfo = await API.Core.GetModuleInfoAsync();
		const instanceModule = instanceInfo.ModuleName;

		// If its not MinecraftModule, return
		if (instanceModule !== 'MinecraftModule') return;

		// GetUpdates to clear the console
		await API.Core.GetUpdatesAsync();

		// Execute the RCON command
		await sendConsoleMessage(API, 'neoforge tps');

		// Wait half a second for the command to be processed
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Fetch the last console message
		const consoleResponse = await API.Core.GetUpdatesAsync();
		const consoleOutput = consoleResponse.ConsoleEntries.sort((a, b) => a.Timestamp - b.Timestamp);

		// Combine the console messages into a single string
		const combinedOutput = consoleOutput.map((entry) => entry.Contents).join('\n');

		const regex = /^(.+?):\s+([\d.]+)\s+TPS\s+\(([\d.]+)\s+ms\/tick\)$/gm;

		const dimensions = [];
		let match;

		while ((match = regex.exec(combinedOutput)) !== null) {
			let [_, rawName, tps, ms] = match;

			// Prettify mod:name to "Name"
			if (rawName.includes(':')) {
				rawName = rawName
					.split(':')[1]
					.replace(/_/g, ' ')
					.replace(/\b\w/g, (c) => c.toUpperCase());
			}

			dimensions.push({
				name: rawName,
				tps: parseFloat(match[2]),
				msPerTick: parseFloat(match[3]),
			});
		}

		// Filter out dimensions that are not in the allowed names
		const allowedNames = new Set(['Overworld', 'The Nether', 'The End', 'The Other']);
		const filteredDimensions = dimensions.filter((dim) => allowedNames.has(dim.name));

		// Now lets run some commands to send it to the users on the server as a scoreboard
		for (const dim of filteredDimensions) {
			console.log(`Dimension: ${dim.name}, TPS: ${dim.tps}, ms/tick: ${dim.msPerTick}`);

			const name = dim.name.replace(/ /g, '_').replace(/"/g, '\\"');
			const score = Math.floor(dim.tps); // Round or scale as needed

			const command = `scoreboard players set ${name} tps ${score}`;
			await sendConsoleMessage(API, command);
		}

		// Show the scoreboard on the sidebar
		await sendConsoleMessage(API, `scoreboard objectives setdisplay sidebar tps`);

		// Finally, send a message to the Discord channel
		const formattedTPS = filteredDimensions.map((dim) => `${dim.name}: ${dim.tps} TPS (${dim.msPerTick} ms/tick)`).join('\n');
		await serverLink('SERVER', formattedTPS, INSTANCE);

		// After a minute, hide the scoreboard and reset the scores
		setTimeout(async () => {
			await sendConsoleMessage(API, `scoreboard objectives setdisplay sidebar`);
			await sendConsoleMessage(API, 'scoreboard players reset * tps');
		}, 60000);
	},
};
