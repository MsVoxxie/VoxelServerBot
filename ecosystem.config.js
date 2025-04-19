module.exports = {
	apps: [
		{
			name: 'VoxelServers',
			script: './vs.bot.js',
			watch: true,
			ignore_watch: ['node_modules', '.git', 'package-lock.json', 'package.json', 'images/playerheads'],
		},
	],
};
