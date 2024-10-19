async function getImageSource(DisplayImageSource) {
	if (!DisplayImageSource) throw new Error('No DisplayImageSource provided');

	// Split the source by the first occurrence of : to get the type and the game
	const [type, ...rest] = DisplayImageSource.split(':');
	const game = rest.join(':'); // Join the rest of the parts back with ':' to get the full url, if present

	// Declare the source variable
	let source;

	// Manage the type with switch case
	switch (type) {
		case 'internal':
			source = `${process.env.AMP_URI}/Plugins/ADSModule/Images/${game}.jpg`;
			break;

		case 'steam':
			source = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game}/header.jpg`;
			break;

		case 'url':
			source = game;
			break;

		default:
			throw new Error('Invalid type provided');
	}
	return source;
}

module.exports = {
	getImageSource,
};
