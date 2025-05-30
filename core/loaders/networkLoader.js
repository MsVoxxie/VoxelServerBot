module.exports = (client) => {
	const si = require('systeminformation');
	const ping = require('ping');

	const PING_HOST = '1.1.1.1'; // Cloudflare
	const INTERFACE = 'eth0';

	// Thresholds
	const HIGH_PING_MS = 80; // Unusually high for my network
	const LOW_NET_Mbps = 2;
	const CHECK_INTERVAL_MS = 5000;

	// Debounce counters & state
	let highPingCount = 0;
	let stablePingCount = 0;
	let failedPingCount = 0;
	let notificationSent = false;
	let networkFailed = false;

	const HIGH_PING_LIMIT = 3; // sad ping limit
	const STABLE_PING_LIMIT = 5; // happy ping limit
	const FAILED_PING_LIMIT = 5; // failed ping limit

	async function emitNetworkAlert(alertType, alertMessage, alertDetails) {
		if (client.debug) {
			console.warn(`[DEBUG] Network Alert: ${alertType} | ${alertMessage} | ${alertDetails}`);
		}

		// Emit network event
		client.emit('networkNotice', {
			type: alertType,
			message: alertMessage,
			details: alertDetails,
		});
	}

	async function monitorNetwork() {
		const [ifaceStats] = await si.networkStats(INTERFACE);
		const netRxMbps = (ifaceStats.rx_sec * 8) / 1_000_000;
		const netTxMbps = (ifaceStats.tx_sec * 8) / 1_000_000;

		const pingRes = await ping.promise.probe(PING_HOST, {
			timeout: 2,
			extra: ['-c', '1'],
		});

		const pingMs = pingRes.time;
		const pingAlive = pingRes.alive;

		const netIdle = netRxMbps < LOW_NET_Mbps && netTxMbps < LOW_NET_Mbps;

		if (!pingAlive) {
			if (failedPingCount < FAILED_PING_LIMIT) failedPingCount++;
			if (failedPingCount >= FAILED_PING_LIMIT && !networkFailed) {
				// Reset counters on failure
				highPingCount = 0;
				stablePingCount = 0;
				notificationSent = false;
				emitNetworkAlert('Network Failure', 'Network Failure Detected', {
					server: `↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(2)} Mbps`,
					external: `⇄ Failed`,
				});
				networkFailed = true;
			}
			return;
		} else {
			networkFailed = false;
			failedPingCount = 0;
		}

		const isHighPing = pingMs > HIGH_PING_MS;

		if (isHighPing) {
			if (highPingCount < HIGH_PING_LIMIT) highPingCount++;
			stablePingCount = 0;
			if (client.debug) {
				console.warn(`[DEBUG] High ping detected: ${pingMs} ms (${highPingCount}/${HIGH_PING_LIMIT})`);
			}
			if (highPingCount >= HIGH_PING_LIMIT && !notificationSent) {
				if (netIdle) {
					emitNetworkAlert('External Congestion', 'Network Congested', {
						server: `↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(2)} Mbps`,
						external: `⇄ ${pingMs} ms`,
					});
				} else {
					emitNetworkAlert('Server Congestion', 'Server Congested', {
						server: `↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(2)} Mbps`,
						external: `⇄ ${pingMs} ms`,
					});
				}
				notificationSent = true;
			}
		} else {
			if (stablePingCount < STABLE_PING_LIMIT) stablePingCount++;
			if (highPingCount > 0) highPingCount--;
			if (notificationSent && stablePingCount >= STABLE_PING_LIMIT) {
				emitNetworkAlert('Network Stable', `Network has recovered`, {
					server: `↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(2)} Mbps`,
					external: `⇄ ${pingMs} ms`,
				});
				notificationSent = false;
			}
			if (client.debug) {
				console.log(
					`[DEBUG] Network Status: ⇄ Ping ${pingMs} ms | ↓ ${netRxMbps.toFixed(2)} Mbps ↑ ${netTxMbps.toFixed(
						2
					)} Mbps | High Ping Count: ${highPingCount} | Stable Ping Count: ${stablePingCount}`
				);
			}
		}
	}

	// Start the loop
	setInterval(monitorNetwork, CHECK_INTERVAL_MS);
};
