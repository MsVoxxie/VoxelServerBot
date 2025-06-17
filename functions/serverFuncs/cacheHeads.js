const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { AttachmentBuilder } = require('discord.js');

// Set cache location and TTL (in milliseconds)
const MC_CACHE_DIR = path.join(__dirname, '../../core/loaders/api/public/images/playerheads');
const STEAM_CACHE_DIR = path.join(__dirname, '../../core/loaders/api/public/images/steamavatars');
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MC_PLACEHOLDER_PATH = path.join(MC_CACHE_DIR, 'placeholder.png');
const STEAM_PLACEHOLDER_PATH = path.join(STEAM_CACHE_DIR, 'placeholder.png');
const STEAM_API_KEY = process.env.STEAM_API_KEY;

if (!fs.existsSync(MC_CACHE_DIR)) fs.mkdirSync(MC_CACHE_DIR);
if (!fs.existsSync(STEAM_CACHE_DIR)) fs.mkdirSync(STEAM_CACHE_DIR);

// Get UUID from username
async function getUUID(username) {
	const res = await fetch(`https://api.minecraftservices.com/minecraft/profile/lookup/name/${username}`, {
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) throw new Error('Failed to fetch UUID');
	const data = await res.json();
	return data.id;
}

// Check if a file is fresh (not older than TTL)
function isCacheFresh(filePath, ttl = CACHE_TTL) {
	if (!fs.existsSync(filePath)) return false;
	const stats = fs.statSync(filePath);
	const age = Date.now() - stats.mtimeMs;
	return age < ttl;
}

// Download head PNG and save to cache
async function downloadHead(uuid, filePath) {
	const res = await fetch(`https://crafatar.com/renders/head/${uuid}?size=5&overlay=true`);
	if (!res.ok) throw new Error('Failed to fetch head image');
	const buffer = await res.buffer();
	fs.writeFileSync(filePath, buffer);
	return buffer;
}

// Download Steam avatar and save to cache
async function downloadSteamAvatar(steam64, filePath) {
	const apiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steam64}`;
	const res = await fetch(apiUrl);
	if (!res.ok) throw new Error('Failed to fetch Steam profile');
	const data = await res.json();
	const player = data.response.players[0];
	if (!player || !player.avatarfull) throw new Error('No avatar found for this SteamID');
	const avatarRes = await fetch(player.avatarfull);
	if (!avatarRes.ok) throw new Error('Failed to fetch avatar image');
	const buffer = await avatarRes.buffer();
	fs.writeFileSync(filePath, buffer);
	return buffer;
}

// Main function: Get head from cache or fetch it
async function getPlayerHead(username) {
	const uuid = await getUUID(username);
	const filePath = path.join(MC_CACHE_DIR, `${username}.png`);

	if (!isCacheFresh(filePath)) {
		await downloadHead(uuid, filePath); // Save to disk
	}

	// Build a discord Attachment
	const discordAttachment = new AttachmentBuilder(filePath, { name: `${username}.png` });

	return { path: filePath, attachment: discordAttachment };
}

async function getPlayerHead(username) {
	let uuid;
	try {
		uuid = await getUUID(username);
	} catch (err) {
		return MC_PLACEHOLDER_PATH;
	}
	const filePath = path.join(MC_CACHE_DIR, `${username}.png`);

	// Get the head
	try {
		if (!isCacheFresh(filePath)) {
			await downloadHead(uuid, filePath);
		}
		return filePath;
	} catch (err) {
		return MC_PLACEHOLDER_PATH;
	}
}

// Main function: Get Steam avatar from cache or fetch it
async function getSteamAvatar(steam64, apiKey) {
	const filePath = path.join(STEAM_CACHE_DIR, `${steam64}.png`);
	if (!isCacheFresh(filePath)) {
		try {
			await downloadSteamAvatar(steam64, filePath, apiKey);
		} catch (err) {
			return STEAM_PLACEHOLDER_PATH;
		}
	}
	return filePath;
}

module.exports = {
	getPlayerHead,
	getSteamAvatar,
	MC_CACHE_DIR,
	STEAM_CACHE_DIR,
};
