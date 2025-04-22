const logger = require('../logging/logger');

const taskQueues = new Map();
let debugEnabled = true;
let delay = 2000;

function enableDebugLogging(enable = true) {
	debugEnabled = enable;
}

function logDebug(message) {
	if (debugEnabled) {
		logger.info(message);
	}
}

function createQueue() {
	const queue = [];
	let processing = false;

	async function process() {
		if (processing || queue.length === 0) return;
		processing = true;

		logDebug('Queue started processing.');

		while (queue.length > 0) {
			const { fn, args, resolve, reject } = queue.shift();
			logDebug(`Processing task: ${fn.name} with args: ${JSON.stringify(args)}`);

			try {
				const result = await fn(...args);
				resolve(result);
				logDebug(`Task completed: ${fn.name}`);
				await new Promise((res) => setTimeout(res, 100)); // optional delay
			} catch (err) {
				logger.error('Queue task error:', err);
				reject(err);
			}
		}

		processing = false;
		logDebug('Queue finished processing.');
	}

	function add(fn, args) {
		logDebug(`Adding task: ${fn.name} with args: ${JSON.stringify(args)}`);
		return new Promise((resolve, reject) => {
			queue.push({ fn, args, resolve, reject });
			if (delay) {
				logDebug(`Delaying task execution by ${delay}ms`);
				setTimeout(() => process(), delay);
				return;
			}
			process();
		});
	}

	return { add };
}

function getOrCreateQueue(key = 'default') {
	if (!taskQueues.has(key)) {
		taskQueues.set(key, createQueue());
	}
	return taskQueues.get(key);
}

function queueTask(key, fn, ...args) {
	const queue = getOrCreateQueue(key);
	return queue.add(fn, args);
}

module.exports = {
	queueTask,
	enableDebugLogging,
};
