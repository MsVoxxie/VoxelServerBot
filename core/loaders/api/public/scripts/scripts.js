const bar = document.getElementById('refresh-bar');
let time = 0;
const interval = 10;

async function fetchInstanceData() {
	const container = document.getElementById('instances');
	const statusWrapper = document.getElementById('status-wrapper');

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

	let data;
	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		data = await res.json();
	} catch (err) {
		console.error('Error fetching instance data:', err);
		return;
	}

	statusWrapper.classList.add('fade-in');
	const newIds = data.instances.map((i) => i.instanceId);

	// Remove cards that are no longer present
	Array.from(container.querySelectorAll('.instance-card')).forEach((card) => {
		if (!newIds.includes(card.dataset.id)) container.removeChild(card);
	});

	// Update or create cards
	data.instances.forEach((inst) => {
		let card = container.querySelector(`.instance-card[data-id="${inst.instanceId}"]`);
		if (!card) {
			card = document.createElement('div');
			card.classList.add('instance-card');
			card.dataset.id = inst.instanceId;
			container.appendChild(card);
		}

		// Update card classes
		card.classList.toggle('starting', inst.server.state === 'Starting');
		card.classList.toggle('running', inst.server.state === 'Running');
		card.classList.toggle('stopped', inst.server.state === 'Stopped');
		card.classList.toggle('offline', inst.server.state === 'Offline');

		const isRunning = inst.server.state === 'Running' || inst.server.state === 'Starting';
		const serverUptime = inst.server.uptime ? `<p class="uptime">Online ${humanizeDuration(inst.server.uptime)}</p>` : '';
		const modpackURL =
			inst.module === 'Minecraft' && inst.welcomeMessage
				? `<a class="server-link" href="${inst.welcomeMessage}" target="_blank"><h2>${inst.friendlyName}</h2></a>`
				: `<h2>${inst.friendlyName}</h2>`;
		const memCurrentGB = inst.server.memory ? (inst.server.memory.RawValue / 1024).toFixed(2) : null;
		const memMaxGB = inst.server.memory ? (inst.server.memory.MaxValue / 1024).toFixed(0) : null;
		const memDisplay = memCurrentGB && memMaxGB ? `${memCurrentGB}/${memMaxGB} GB` : 'N/A';
		const cpuDisplay = inst.server.cpu && inst.server.cpu.Percent != null ? `${inst.server.cpu.Percent}%` : 'N/A';
		const performanceDisplay = inst.server.performance
			? `<p>${inst.server.performance.Unit}: ${inst.server.performance.RawValue}/${inst.server.performance.MaxValue}</p>`
			: '<p>TPS: N/A</p>';
		const playerDisplay = inst.server.users ? `${inst.server.users.RawValue}/${inst.server.users.MaxValue}` : 'N/A';
		const ipDisplay = isRunning
			? `
        <div class="ip-display">
          <span class="ip-text">${inst.server.ip}:${inst.server.port}</span>
          <button class="copy-btn" onclick="copyToClipboard('${inst.server.ip}:${inst.server.port}', this)">Copy</button>
        </div>
      `
			: '';

		// Only update the content inside the card, not the card itself
		let overlay = card.querySelector('.instance-card-overlay');
		let content = card.querySelector('.instance-card-content');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.className = 'instance-card-overlay';
			card.appendChild(overlay);
		}
		overlay.style.backgroundImage = `url('${inst.icon}')`;

		if (!content) {
			content = document.createElement('div');
			content.className = 'instance-card-content';
			content.dataset.instanceid = inst.instanceId;
			card.appendChild(content);
		}

		// Click event for the card
		card.onclick = () => {
			window.location.href = `/v1/servers/${inst.instanceId}`;
		};

		content.innerHTML = `
            ${modpackURL}
            <hr class="divider">
            ${serverUptime}
            ${
							isRunning
								? `
                        <p>CPU Usage: ${cpuDisplay}</p>
                        <p>Memory Usage: ${memDisplay}</p>
                        ${performanceDisplay}
                        <p>Players: ${playerDisplay}</p>
                        ${ipDisplay}
                    `
								: `
                        <p class="offline-label">Server ${inst.server.state}</p>
                    `
						}
        `;
	});
}

function updateBar() {
	if (time >= interval) {
		bar.style.width = '100%';
		setTimeout(() => {
			time = 0;
			bar.style.transition = 'none';
			bar.style.width = '0%';
			void bar.offsetWidth;
			bar.style.transition = 'width 1s linear';
			fetchInstanceData();
		}, 50);
	} else {
		time++;
		bar.style.width = `${(time / interval) * 100}%`;
	}
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

function humanizeDuration(input) {
	const [d, h, m, s] = input.split(':').map(Number);
	const parts = [];

	if (d) parts.push(`${d} day${d !== 1 ? 's' : ''}`);
	if (h) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
	if (m) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
	if (s) parts.push(`${s} second${s !== 1 ? 's' : ''}`);

	if (parts.length === 0) return 'for 0 seconds';
	if (parts.length === 1) return `for ${parts[0]}`;

	const last = parts.pop();
	return `for ${parts.join(', ')} and ${last}`;
}

//  Wave animation
document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.wave').forEach((wave) => {
		const minDur = 50;
		const maxDur = 70;
		const dur = (Math.random() * (maxDur - minDur) + minDur).toFixed(2);
		const delay = -(Math.random() * dur).toFixed(2); //  -0…-dur
		wave.style.animationDuration = `${dur}s`;
		wave.style.animationDelay = `${delay}s`;
		// hint the browser to keep this smooth
		wave.style.willChange = 'transform';
	});
});

// initial load + start ticking
fetchInstanceData();
setInterval(updateBar, 1000);
