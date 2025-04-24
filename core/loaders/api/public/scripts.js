const bar = document.getElementById('refresh-bar');
let time = 0;
const interval = 10;

async function fetchInstanceData() {
	const container = document.getElementById('instances');
	const statusWrapper = document.getElementById('status-wrapper');

	// Save the initial positions of existing cards
	const existingCards = Array.from(container.querySelectorAll('.instance-card'));
	const firstRects = new Map(existingCards.map((card) => [card.dataset.id, card.getBoundingClientRect()]));

	// Fetch new data
	let data;
	try {
		const res = await fetch('/v1/server/data/instancedata');
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		data = await res.json();
	} catch (err) {
		console.error('Error fetching instance data:', err);
		return;
	}

	// Add fade-in class to the status wrapper
	statusWrapper.classList.add('fade-in');

	const newIds = data.instances.map((i) => i.instanceId);

	// Remove cards that are no longer present
	existingCards.forEach((card) => {
		if (!newIds.includes(card.dataset.id)) container.removeChild(card);
	});

	// Reuse existing cards or create new ones
	const newOrder = data.instances.map((inst) => {
		let card = container.querySelector(`.instance-card[data-id="${inst.instanceId}"]`);
		if (!card) {
			card = document.createElement('div');
			card.classList.add('instance-card');
			card.dataset.id = inst.instanceId;
		}

		// Add CSS classes based on server state
		card.classList.toggle('starting', inst.server.state === 'Starting');
		card.classList.toggle('running', inst.server.state === 'Running');
		card.classList.toggle('stopped', inst.server.state === 'Stopped');
		card.classList.toggle('offline', inst.server.state === 'Offline');

		const isRunning = inst.server.state === 'Running' || inst.server.state === 'Starting';

		// Uptime
		const serverUptime = inst.server.uptime ? `<p class="uptime">Online ${humanizeDuration(inst.server.uptime)}</p>` : '';

		// Modpack url
		const modpackURL =
			inst.module === 'Minecraft' && inst.welcomeMessage
				? `<a class="server-link" href="${inst.welcomeMessage}" target="_blank"><h2>${inst.friendlyName}</h2></a>`
				: `<h2>${inst.friendlyName}</h2>`;

		// Memory in GB
		const memCurrentGB = inst.server.memory ? (inst.server.memory.RawValue / 1024).toFixed(2) : null;
		const memMaxGB = inst.server.memory ? (inst.server.memory.MaxValue / 1024).toFixed(0) : null;
		const memDisplay = memCurrentGB && memMaxGB ? `${memCurrentGB}/${memMaxGB} GB` : 'N/A';

		// CPU percentage
		const cpuDisplay = inst.server.cpu && inst.server.cpu.Percent != null ? `${inst.server.cpu.Percent}%` : 'N/A';

		// Performance
		const performanceDisplay = inst.server.performance
			? `<p>${inst.server.performance.Unit}: ${inst.server.performance.RawValue}/${inst.server.performance.MaxValue}</p>`
			: '<p>TPS: N/A</p>';

		// Player and IP display
		const playerDisplay = inst.server.users ? `${inst.server.users.RawValue}/${inst.server.users.MaxValue}` : 'N/A';
		const ipDisplay = isRunning
			? `
        <div class="ip-display">
          <span class="ip-text">${inst.server.ip}:${inst.server.port}</span>
          <button class="copy-btn" onclick="copyToClipboard('${inst.server.ip}:${inst.server.port}', this)">Copy</button>
        </div>
      `
			: '';

		// Ugly mess
		card.innerHTML = `
        <div class="instance-card-overlay" style="background-image:url('${inst.icon}')"></div>
        <div class="instance-card-content">
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
        </div>
    `;
		return card;
	});

	// Animate the transition
	newOrder.forEach((card) => container.appendChild(card));
	newOrder.forEach((card) => {
		const first = firstRects.get(card.dataset.id);
		const last = card.getBoundingClientRect();
		if (first) {
			const dx = first.left - last.left;
			const dy = first.top - last.top;
			if (dx || dy) {
				card.style.transform = `translate(${dx}px,${dy}px)`;
				card.style.transition = 'transform 0s';
				requestAnimationFrame(() => {
					card.style.transition = 'transform 300ms ease';
					card.style.transform = '';
				});
			}
		}
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
