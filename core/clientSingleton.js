let client = null;

module.exports = {
	setClient: (c) => {
		client = c;
	},
	getClient: () => client,
};
