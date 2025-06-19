async function sendToWeb(INSTANCE, USER, MESSAGE) {
	const API_SECRET = process.env.API_SECRET;
	const response = await fetch(`${process.env.EXT_URI_PROD}/api/chat/receive`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${API_SECRET}`,
		},
		body: JSON.stringify({ instance: INSTANCE, user: USER, message: MESSAGE }),
	});
	if (!response.ok) {
		throw new Error(`Failed to send data: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

module.exports = { sendToWeb };
