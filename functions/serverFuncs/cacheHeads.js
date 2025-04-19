const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { AttachmentBuilder } = require('discord.js');

// Set cache location and TTL (in milliseconds)
const CACHE_DIR = path.join(__dirname, '../../images/playerheads');
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const PLACEHOLDER_PATH = path.join(CACHE_DIR, 'placeholder.png');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

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
	const res = await fetch(`https://crafatar.com/renders/head/${uuid}?overlay`);
	if (!res.ok) throw new Error('Failed to fetch head image');
	const buffer = await res.buffer();
	fs.writeFileSync(filePath, buffer);
	return buffer;
}

// Main function: Get head from cache or fetch it
async function getPlayerHead(username) {
	const uuid = await getUUID(username);
	const filePath = path.join(CACHE_DIR, `${username}.png`);

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
		return PLACEHOLDER_PATH;
	}
	const filePath = path.join(CACHE_DIR, `${username}.png`);

	// Get the head
	try {
		if (!isCacheFresh(filePath)) {
			await downloadHead(uuid, filePath);
		}
		return filePath;
	} catch (err) {
		return PLACEHOLDER_PATH;
	}
}

module.exports = {
	getPlayerHead,
	CACHE_DIR,
};
