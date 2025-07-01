const si = require('systeminformation');
const ping = require('ping');

// Exported mutable network state
const network = {
	externalPing: 0,
	externalAvg: 0,
	externalMedian: 0,
	externalHistory: [],
	networkAlive: true,
	internalUp: 0,
	internalDown: 0,
	lastSpike: null,
	lastSpikeTime: null,
};

module.exports = (client) => {
	// Cooldown period for network alerts
	const COOLDOWN_MS = 60 * 5 * 1000; // 5 minutes

	const PING_HOST = '1.1.1.1'; // Cloudflare
	const INTERFACE = 'eth0';

	const CHECK_INTERVAL_MS = 5000;
	const LOW_NET_Mbps = 2;
	const ABSOLUTE_HIGH_MS = 75;
	const STABLE_PING_MS = 60;
	const RELATIVE_THRESHOLD = 45; // Unused until i better method

	const HIGH_PING_LIMIT = 3;
	const STABLE_PING_LIMIT = 5;
	const FAILED_PING_LIMIT = 5;

	const MAX_HISTORY = 24; // Maximum number of ping records to keep
	const SHORT_TERM = 6; // Last 30 seconds

	let highPingCount = 0;
	let stablePingCount = 0;
	let failedPingCount = 0;
	let notificationSent = false;
	let networkFailed = false;

	const pingHistory = [];

	async function emitNetworkAlert(type, message, details) {
		if (client.debug) {
			console.warn(`[DEBUG] Network Alert: ${type} | ${message} | ${JSON.stringify(details)}`);
		}
		client.emit('networkNotice', { type, message, details });
	}

	function updatePingHistory(pingMs) {
		pingHistory.push(pingMs);
		if (pingHistory.length > MAX_HISTORY) {
			pingHistory.shift();
		}
	}

	function getMedianPing() {
		if (!pingHistory.length) return 0;
		const sorted = [...pingHistory].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
	}

	function getShortTermAverage() {
		const recent = pingHistory.slice(-SHORT_TERM);
		if (!recent.length) return 0;
		return recent.reduce((a, b) => a + b, 0) / recent.length;
	}

	async function monitorNetwork() {
		const [ifaceStats] = await si.networkStats(INTERFACE);
		const netRxMbps = (ifaceStats.rx_sec * 8) / 1_000_000;
		const netTxMbps = (ifaceStats.tx_sec * 8) / 1_000_000;
		const netIdle = netRxMbps < LOW_NET_Mbps && netTxMbps < LOW_NET_Mbps;

		const { alive: pingAlive, time: pingMs } = await ping.promise.probe(PING_HOST, {
			timeout: 2,
			extra: ['-c', '1'],
		});

		updatePingHistory(pingMs);

		const details = {
			server: `↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(2)} Mbps`,
			external: pingAlive ? `⇄ ${pingMs} ms` : '⇄ Failed',
		};

		if (!pingAlive) {
			handlePingFailure(details);
			return;
		}

		resetPingFailureState();

		const medianPing = getMedianPing();
		const shortAvg = getShortTermAverage();
		const isHighPing = pingMs > ABSOLUTE_HIGH_MS;
		const isStablePing = pingMs < STABLE_PING_MS;
		const isSpike = pingMs > shortAvg + 15;

		if (isHighPing) {
			if (Date.now() - (network.lastSpikeTime || 0) < COOLDOWN_MS) return;

			network.lastSpike = pingMs;
			network.lastSpikeTime = Date.now();

			handleHighPing(pingMs, netIdle, details);
		} else if (isStablePing) {
			network.lastSpike = '✓ Stable';
			handleStablePing(pingMs, details);
		} else {
			network.lastSpike = pingMs;
		}

		network.externalPing = pingMs.toFixed(0);
		network.externalAvg = shortAvg.toFixed(0);
		network.externalMedian = medianPing.toFixed(0);
		network.externalHistory = pingHistory.slice(-MAX_HISTORY);
		network.networkAlive = pingAlive;
		network.internalUp = netRxMbps.toFixed(0);
		network.internalDown = netTxMbps.toFixed(0);
	}

	function handlePingFailure(details) {
		if (failedPingCount < FAILED_PING_LIMIT) failedPingCount++;

		if (failedPingCount >= FAILED_PING_LIMIT && !networkFailed) {
			highPingCount = 0;
			stablePingCount = 0;
			notificationSent = false;
			emitNetworkAlert('Network Failure', 'Network Interrupted', details);
			networkFailed = true;
		}
	}

	function resetPingFailureState() {
		network.lastSpike = '× Disconnected';
		networkFailed = false;
		failedPingCount = 0;
	}

	function handleHighPing(pingMs, netIdle, details) {
		if (highPingCount < HIGH_PING_LIMIT) highPingCount++;
		stablePingCount = 0;

		if (client.debug) {
			console.warn(`[DEBUG] High ping detected: ${pingMs} ms (${highPingCount}/${HIGH_PING_LIMIT})`);
		}

		if (highPingCount >= HIGH_PING_LIMIT && !notificationSent) {
			const type = netIdle ? 'External Congestion' : 'Server Congestion';
			const message = netIdle ? 'Network Congested' : 'Server Congested';
			emitNetworkAlert(type, message, details);
			notificationSent = true;
		}
	}

	function handleStablePing(pingMs, details) {
		if (stablePingCount < STABLE_PING_LIMIT) stablePingCount++;
		if (highPingCount > 0) highPingCount--;

		if (notificationSent && stablePingCount >= STABLE_PING_LIMIT) {
			emitNetworkAlert('Network Stable', 'Network has recovered', details);
			notificationSent = false;
		}
	}

	setInterval(monitorNetwork, CHECK_INTERVAL_MS);
};

// Export the mutable network object
module.exports.network = network;
