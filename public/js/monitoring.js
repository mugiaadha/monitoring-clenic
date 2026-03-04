async function fetchStatuses() {
    try {
        const res = await fetch('/statuses');
        if (!res.ok) throw new Error('Network response was not ok');
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

function createCard(item) {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-4 col-lg-4';

    const card = document.createElement('div');
    card.className = 'card shadow-sm p-2 h-100';

    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.style.backgroundColor = (item.status === 200) ? '#198754' : '#dc3545';

    card.innerHTML = `
    <div class="d-flex justify-content-between">
      <div>
        <div class="fw-semibold">${item.name}</div>
        <div class="text-muted small">${item.url}</div>
      </div>
      <div class="text-end">
        ${item.status === 200 ? '<span class="badge bg-success">ONLINE</span>' : '<span class="badge bg-danger">OFFLINE</span>'}
        <div class="text-muted small mt-1">${item.last_checked}</div>
      </div>
    </div>
  `;

    card.querySelector('.d-flex').prepend(dot);
    col.appendChild(card);
    return col;
}

function renderGrid(items) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    items.forEach(it => grid.appendChild(createCard(it)));
}

function renderStats(items, meta) {
    const stats = document.getElementById('stats');
    const online = items.filter(i => i.ok).length;
    const offline = items.length - online;
    const cached = meta && meta.cached;
    const cachedAt = meta && meta.cached_at ? meta.cached_at : null;

    stats.innerHTML = `
    <div class="d-flex gap-2 align-items-center">
      <div><span class="badge bg-success">ONLINE ${online}</span></div>
      <div><span class="badge bg-danger">OFFLINE ${offline}</span></div>
      <div>${cached ? `<span class="badge bg-secondary">CACHED</span> <small class="text-muted">${cachedAt || ''}</small>` : ''}</div>
    </div>
  `;
}

async function loadAndRender() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'inline';

    const resp = await fetchStatuses();
    const lastUpdated = document.getElementById('lastUpdated');
    if (!resp) {
        if (lastUpdated) lastUpdated.textContent = 'Gagal memuat data';
        if (loadingEl) loadingEl.style.display = 'none';
        console.error('fetchStatuses returned null');
        return;
    }

    const items = Array.isArray(resp.data) ? resp.data : resp;
    const meta = resp.meta || null;

    try {
        renderGrid(items);
        renderStats(items, meta);
    } catch (e) {
        console.error('Render error', e);
    }

    if (lastUpdated) {
        if (meta && meta.cached_at) {
            lastUpdated.textContent = 'Terakhir: ' + (meta.cached_at);
        } else {
            lastUpdated.textContent = 'Terakhir: ' + new Date().toLocaleString();
        }
    }
    if (loadingEl) loadingEl.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRender);
    loadAndRender();
    setInterval(loadAndRender, 3000);
});
