let currentPlayerLists = {}; // Store current player lists
const bar = document.getElementById('refresh-bar');
let time = 0;
const interval = 2;

// save last state
let lastState = {};

// Update the status bar every second
function updateBar() {
	if (time >= interval) {
		bar.style.width = '100%';
		setTimeout(() => {
			time = 0;
			bar.style.transition = 'none';
			bar.style.width = '0%';
			void bar.offsetWidth;
			bar.style.transition = 'width 1s linear';
			reloadStatus();
		}, 50);
	} else {
		time++;
		bar.style.width = `${(time / interval) * 100}%`;
	}
}

// Fetch fresh JSON from back-end
async function reloadStatus() {
	const pageWrapper = document.getElementsByClassName('page-wrapper')[0];

	// Regex pattern for detecting a valid instanceId
	const instanceIdRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
	const pathParts = window.location.pathname.split('/');
	let instanceId = null;
	const lastPart = pathParts[pathParts.length - 1];
	if (instanceIdRegex.test(lastPart)) {
		instanceId = lastPart;
	}

	let url = '/v1/server/data/instances';
	if (instanceId) url += `/${encodeURIComponent(instanceId)}`;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(res.statusText);
		const json = await res.json();
		updateCards(json.instances);
		pageWrapper.classList.add('fade-in');
	} catch (err) {
		console.error('could not reload status:', err);
	}
}

// Walk each card and update its fields
function updateCards(instances) {
	const presentInstanceIds = new Set(instances.filter((inst) => !inst.suspended).map((inst) => inst.instanceId));

	instances
		.filter((inst) => !inst.suspended)
		.forEach((inst) => {
			let card = document.querySelector(`.instance-card[data-id="${inst.instanceId}"]`);

			// If the card doesn't exist, create and append it
			if (!card) {
				card = initializeCard(inst);
				document.querySelector('.grid').appendChild(card);
			}

			// Update border color
			const border = card.querySelector('.status-border');
			if (border) {
				const state = inst.server.state;
				border.className =
					'absolute inset-0 border-2 rounded-2xl pointer-events-none status-border ' +
					(state === 'Running'
						? 'border-green-500'
						: state === 'Stopping'
						? 'border-orange-500'
						: state === 'Stopped'
						? 'border-red-500'
						: state === 'Starting'
						? 'border-yellow-500'
						: 'border-gray-500');

				lastState[inst.instanceId] = state;
			}

			// Update CPU
			const cpuPercent = card.querySelector('.cpu-percent');
			const cpuMax = card.querySelector('.cpu-max');
			const cpuBarInner = card.querySelector('.cpu-bar > div');
			if (inst.server.cpu) {
				if (cpuPercent) cpuPercent.textContent = inst.server.cpu.Percent + '%';
				if (cpuMax) cpuMax.textContent = 'of ' + inst.server.cpu.MaxValue + '%';
				if (cpuBarInner) cpuBarInner.style.width = inst.server.cpu.Percent + '%';
			} else {
				if (cpuPercent) cpuPercent.textContent = 'N/A';
				if (cpuMax) cpuMax.textContent = 'of 0%';
				if (cpuBarInner) cpuBarInner.style.width = '0%';
			}

			// Update Memory
			const memUsed = card.querySelector('.mem-used');
			const memMax = card.querySelector('.mem-max');
			const memBarInner = card.querySelector('.mem-bar > div');
			if (inst.server.memory) {
				if (memUsed) memUsed.textContent = (inst.server.memory.RawValue / 1024).toFixed(1) + ' GB';
				if (memMax) memMax.textContent = 'of ' + (inst.server.memory.MaxValue / 1024).toFixed(1) + ' GB';
				if (memBarInner) memBarInner.style.width = inst.server.memory.Percent + '%';
			} else {
				if (memUsed) memUsed.textContent = 'N/A';
				if (memMax) memMax.textContent = 'of 0 GB';
				if (memBarInner) memBarInner.style.width = '0%';
			}

			// Update Performance
			const perfValue = card.querySelector('.perf-value');
			const perfMax = card.querySelector('.perf-max');
			let perfBarInner = card.querySelector('.perf-bar > .bar-inner');

			// Only create the performance bar if performance values exist
			if (inst.server.performance && !perfBarInner) {
				const perfBar = document.createElement('div');
				perfBar.classList.add('w-full', 'bg-gray-700', 'rounded-full', 'h-2', 'mt-1', 'perf-bar');

				perfBarInner = document.createElement('div');
				perfBarInner.classList.add('bar-inner', 'bg-yellow-500', 'h-2', 'rounded-full');
				perfBarInner.style.width = '0%';

				perfBar.appendChild(perfBarInner);

				// Create the performance container
				const perfContainer = document.createElement('div');
				perfContainer.classList.add('text-sm', 'text-gray-300', 'mt-2');
				perfContainer.innerHTML = `
				<div class="text-sm text-gray-300">Performance</div>
				<div class="flex justify-between text-white">
					<span class="perf-value">Loading...</span>
					<span class="perf-max text-gray-400 text-sm">of 0 TPS</span>
				</div>
			`;
				perfContainer.appendChild(perfBar);

				// Append the performance container under memory and above players
				const memoryContainer = card.querySelector('.mem-bar');
				if (memoryContainer) {
					memoryContainer.parentNode.insertBefore(perfContainer, memoryContainer.nextSibling);
				} else {
					console.warn('Memory container not found for card:', card);
				}
			}

			// Update the performance bar values
			if (inst.server.performance) {
				if (perfValue) perfValue.textContent = inst.server.performance.RawValue;
				if (perfMax) perfMax.textContent = 'of ' + inst.server.performance.MaxValue + ' ' + (inst.server.performance.Unit || 'TPS');
				if (perfBarInner) {
					const pbar = (inst.server.performance.RawValue / inst.server.performance.MaxValue) * 100;
					perfBarInner.style.width = pbar + '%';
				}
			} else {
				if (perfValue) perfValue.textContent = 'N/A';
				if (perfMax) perfMax.textContent = 'of 0 TPS';
				if (perfBarInner) perfBarInner.style.width = '0%';
			}

			// Update Players (for Minecraft)
			const playersContainer = card.querySelector('.players-container');
			const playersCount = card.querySelector('.players-count');
			if (playersContainer) {
				if (inst.module === 'Minecraft') {
					const players = inst.players || []; // Default to an empty array if no players
					const currentPlayers = players.map((player) => player.name).join(',');

					// Only update player heads if the list changed
					if (currentPlayerLists[inst.instanceId] !== currentPlayers || inst.server.state !== 'Running') {
						currentPlayerLists[inst.instanceId] = currentPlayers;

						// Remove all children (player heads and empty slots)
						playersContainer.innerHTML = '';

						// Add new player heads or placeholder slots
						const maxPlayers = inst.server.state === 'Running' ? inst.server.users?.MaxValue || players.length : 10;
						for (let i = 0; i < maxPlayers; i++) {
							if (i < players.length && inst.server.state === 'Running') {
								// Show actual player heads
								const playerImg = document.createElement('img');
								playerImg.src = `/v1/client/playerheads/${players[i].name}`;
								playerImg.alt = players[i].name;
								playerImg.title = players[i].name;
								playerImg.classList.add('w-6', 'h-6', 'rounded-full', 'bg-gray-700', 'object-cover', 'pop-in');
								playersContainer.appendChild(playerImg);
							} else {
								// Show placeholder slots
								const emptySlot = document.createElement('div');
								emptySlot.classList.add('w-6', 'h-6', 'rounded-full', 'bg-gray-600', 'bg-opacity-30', 'pop-in');
								playersContainer.appendChild(emptySlot);
							}
						}
						// Update player count
						if (playersCount) {
							playersCount.textContent = `${players.length} / ${maxPlayers} players`;
						}
					}
				} else {
					// Not Minecraft or no players: clear the container
					playersContainer.innerHTML = '';
					currentPlayerLists[inst.instanceId] = '';
				}
			}

			// Always update the user bar (orbs) for all servers
			const usersCount = card.querySelector('.users-count');
			const usersMax = card.querySelector('.users-max');
			const usersBarInner = card.querySelector('.users-bar > div');
			if (inst.server.users) {
				if (usersCount) usersCount.textContent = inst.server.users.RawValue;
				if (usersMax) usersMax.textContent = '/ ' + inst.server.users.MaxValue;
				if (usersBarInner) usersBarInner.style.width = inst.server.users.Percent + '%';
			} else {
				if (usersCount) usersCount.textContent = '0';
				if (usersMax) usersMax.textContent = '/ 0';
				if (usersBarInner) usersBarInner.style.width = '0%';
			}

			// Update Connect/Status block
			const connectBlock = card.querySelector('.connect-status');
			if (connectBlock) {
				if (inst.server.state === 'Running') {
					connectBlock.innerHTML = `
                    <div class="text-sm text-gray-300 mb-1">Connect</div>
                    <div class="bg-gray-800 font-mono text-white text-sm p-2 rounded-lg flex items-center justify-center space-x-2 opacity-70 transition hover:opacity-100">
                        <code>${inst.server.ip}:${inst.server.port}</code>
                        <button
                            class="text-blue-400 hover:text-blue-200"
                            onclick="event.stopPropagation(); copyToClipboard('${inst.server.ip}:${inst.server.port}', this)"
                        >
                            Copy
                        </button>
                    </div>
                `;
				} else {
					connectBlock.innerHTML = `
                    <div class="text-sm text-gray-300">Status</div>
                    <div class="text-red-400 font-bold">${inst.server.state}</div>
                `;
				}
			}

			// Make card clickable
			card.onclick = () => {
				window.location.href = `/v1/servers/${inst.instanceId}`;
			};
		});

	// Remove cards that are no longer present
	document.querySelectorAll('.instance-card').forEach((card) => {
		const id = card.getAttribute('data-id');
		if (!presentInstanceIds.has(id)) {
			card.remove();
		}
	});
}

function copyToClipboard(text, button) {
	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				button.textContent = 'Copied!';
				setTimeout(() => {
					button.textContent = 'Copy';
				}, 2000);
			})
			.catch((err) => {
				alert('Failed to copy: ' + err);
			});
	} else {
		alert('Clipboard API not supported');
	}
}

// run once on load
document.addEventListener('DOMContentLoaded', () => {
	reloadStatus();
	setInterval(updateBar, 1000);

	const waveIntensity = 1.5; // Lower for smoother waves

	document.querySelectorAll('.wave').forEach((wave, idx) => {
		const originalD = wave.getAttribute('d');

		function perturbPath(d, amount = 20, phase = 0) {
			const actualAmount = amount * waveIntensity;
			let i = 0;
			return d.replace(/,(-?\d+(\.\d+)?)/g, (match, y) => {
				const base = parseFloat(y);
				// Use a sine wave for smooth offset
				const delta = Math.sin(phase + i * 0.7 + idx) * actualAmount;
				i++;
				return ',' + (base + delta).toFixed(2);
			});
		}

		let phase = 0;
		function animateWave() {
			phase += 0.5 + Math.random() * 0.5;
			const newD = perturbPath(originalD, 18 + Math.random() * 8, phase);
			const shift = (Math.random() - 0.5) * 24;

			anime({
				targets: wave,
				d: [{ value: newD }, { value: originalD }],
				translateX: [{ value: shift }, { value: 0 }],
				duration: 6000 + Math.random() * 5000,
				easing: 'easeInOutSine',
				direction: 'alternate',
				loop: false,
				complete: animateWave,
			});
		}

		animateWave();
	});
});
