const cron = require('node-cron');

// Configuration File
const dotenv = require('dotenv');
dotenv.config();

// Discord Classes
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const TOKEN = process.env.DISCORD_TOKEN;

// Define Client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
	],
	allowedMentions: {
		parse: [],
	},
});

// Client Properties
client.debug = false;
client.colors = {
	base: '#871824',
	success: '#00ff00',
	error: '#ff0000',
	warning: '#ffff00',
};

// Define Collections
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
require('./core/loaders/eventLoader')(client);

// Every 1 minute
cron.schedule('*/1 * * * *', async () => {
	client.emit('oneMinute');
});

// Login
client.login(TOKEN);
