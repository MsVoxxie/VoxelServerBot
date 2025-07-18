// Scheduling
const cron = require('node-cron');

// Configuration File
const dotenv = require('dotenv');
dotenv.config();

// Discord Classes
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const { getStatusPageData } = require('./functions/ampAPI/instanceFunctions');
const TOKEN = process.env.DISCORD_TOKEN;

// Define Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
	],
	allowedMentions: {
		parse: [],
	},
});

client.experimentalFeatures = true;
client.debug = false;
client.colors = {
	base: '#871824',
	success: '#9dff00',
	error: '#ff0000',
	warning: '#ffcc00',
};

// Define Collections
client.backupTimers = new Collection();
client.typingState = new Collection();
client.playTimers = new Collection();
client.crashCount = new Collection();
client.cooldowns = new Collection();
client.commands = new Collection();
client.events = new Collection();

// Load Database
client.mongoose = require('./core/loaders/mongooseLoader');
require('./functions/helpers/timeFuncs')(client);
require('./functions/database/util')(client);

// Run Loaders
require('./core/loaders/api/internalAPI')(client);
require('./core/loaders/commandLoader')(client);
require('./core/loaders/networkLoader')(client);
require('./core/loaders/eventLoader')(client);

// Every 5 seconds
cron.schedule('*/5 * * * * *', async () => {
	client.instanceData = await getStatusPageData();
});

// Every 1 minute
cron.schedule('*/1 * * * *', async () => {
	client.emit('oneMinute');
});

// Every 2 minutes
cron.schedule('*/2 * * * *', async () => {
	client.emit('twoMinutes');
});

// Every 15 minutes
cron.schedule('*/15 * * * *', async () => {
	client.emit('fifteenMinutes');
});

// Every Hour
cron.schedule('0 * * * *', async () => {
	client.emit('hourly');
});

// Login
client.login(TOKEN);

// Add client to singleton
const { setClient } = require('./core/clientSingleton');
setClient(client);
