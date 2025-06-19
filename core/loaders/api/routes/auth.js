const express = require('express');
const router = express.Router();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const OAUTH_SCOPE = ['identify', 'guilds', 'guilds.members.read']; // Add more scopes as needed

// Step 1: Redirect user to Discord OAuth2
router.get('/discord/login', (req, res) => {
	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: REDIRECT_URI,
		response_type: 'code',
		scope: OAUTH_SCOPE.join(' '),
	});
	res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Step 2: Handle Discord OAuth2 callback
router.get('/discord/callback', async (req, res) => {
	const code = req.query.code;
	if (!code) return res.status(400).send('No code provided');

	try {
		// Exchange code for access token
		const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: CLIENT_ID,
				client_secret: CLIENT_SECRET,
				grant_type: 'authorization_code',
				code,
				redirect_uri: REDIRECT_URI,
				scope: OAUTH_SCOPE,
			}),
		});
		if (!tokenResponse.ok) throw new Error('Failed to fetch token');
		const tokenData = await tokenResponse.json();

		const { access_token } = tokenData;

		// Fetch user info
		const userResponse = await fetch('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${access_token}` },
		});
		if (!userResponse.ok) throw new Error('Failed to fetch user');
		const user = await userResponse.json();

		// Here you can create a session, JWT, or whatever you need
		res.json({ user });
	} catch (err) {
		console.error(err);
		res.status(500).send('Discord authentication failed');
	}
});

module.exports = router;
