const bar = document.getElementById('refresh-bar');
let time = 0;
const interval = 10;

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
	instances.forEach((inst) => {
		const card = document.querySelector(`.instance-card[data-id="${inst.instanceId}"]`);
		if (!card) return;

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
		}

		// Update CPU
		if (inst.server.cpu) {
			const cpuPercent = card.querySelector('.cpu-percent');
			const cpuMax = card.querySelector('.cpu-max');
			const cpuBarInner = card.querySelector('.cpu-bar > div');
			if (cpuPercent) cpuPercent.textContent = inst.server.cpu.Percent + '%';
			if (cpuMax) cpuMax.textContent = 'of ' + inst.server.cpu.MaxValue + '%';
			if (cpuBarInner) cpuBarInner.style.width = inst.server.cpu.Percent + '%';
		}

		// Update Memory
		if (inst.server.memory) {
			const memUsed = card.querySelector('.mem-used');
			const memMax = card.querySelector('.mem-max');
			const memBarInner = card.querySelector('.mem-bar > div');
			if (memUsed) memUsed.textContent = (inst.server.memory.RawValue / 1024).toFixed(1) + ' GB';
			if (memMax) memMax.textContent = 'of ' + (inst.server.memory.MaxValue / 1024).toFixed(1) + ' GB';
			if (memBarInner) memBarInner.style.width = inst.server.memory.Percent + '%';
		}

		// Update Players
		if (inst.server.users) {
			const usersCount = card.querySelector('.users-count');
			const usersMax = card.querySelector('.users-max');
			const usersBarInner = card.querySelector('.users-bar > div');
			if (usersCount) usersCount.textContent = inst.server.users.RawValue;
			if (usersMax) usersMax.textContent = '/ ' + inst.server.users.MaxValue;
			if (usersBarInner) usersBarInner.style.width = inst.server.users.Percent + '%';
		}

		// Update Performance
		if (inst.server.performance) {
			const perfValue = card.querySelector('.perf-value');
			const perfMax = card.querySelector('.perf-max');
			const perfBarInner = card.querySelector('.perf-bar > div');
			if (perfValue) perfValue.textContent = inst.server.performance.RawValue;
			if (perfMax) perfMax.textContent = 'of ' + inst.server.performance.MaxValue + ' ' + (inst.server.performance.Unit || 'TPS');
			if (perfBarInner) {
				const pbar = (inst.server.performance.RawValue / inst.server.performance.MaxValue) * 100;
				perfBarInner.style.width = pbar + '%';
			}
		}

		// Update Connect/Status block
		const connectBlock = card.querySelector('.connect-status');
		if (connectBlock) {
			if (inst.server.state === 'Running') {
				// Show connect info
				connectBlock.innerHTML = `
					<div class="text-sm text-gray-300 mb-1">Connect</div>
					<div class="bg-gray-800 font-mono text-white text-sm p-2 rounded-lg flex items-center justify-center space-x-2 opacity-70 transition hover:opacity-100">
						<code>${inst.server.ip}:${inst.server.port}</code>
						<button
							class="text-blue-400 hover:text-blue-200"
							onclick="event.stopPropagation(); copyToClipboard('<%= instance.server.ip %>:<%= instance.server.port %>', this)"
						>
							Copy
						</button>
					</div>
				`;
			} else {
				// Show status
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
	document.querySelectorAll('.wave').forEach((wave) => {
		const minDur = 50;
		const maxDur = 70;
		const dur = (Math.random() * (maxDur - minDur) + minDur).toFixed(2);
		const delay = -(Math.random() * dur).toFixed(2);
		wave.style.animationDuration = `${dur}s`;
		wave.style.animationDelay = `${delay}s`;
		wave.style.willChange = 'transform';
	});
});
