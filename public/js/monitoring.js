let lastItems = [];
let lastMeta = null;
let viewMode = localStorage.getItem('monitoring_view') || 'grid';

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

function createCard(item, mode = 'grid') {
    const col = document.createElement('div');
    col.className = (mode === 'grid') ? 'col-12 col-sm-6 col-md-4 col-lg-3' : 'col-12';

    const card = document.createElement('div');
    card.className = 'card shadow-sm p-2 h-100';

    const dot = document.createElement('span');
    dot.className = 'status-dot';
    dot.style.backgroundColor = (item.status === 200) ? '#198754' : '#dc3545';

    const isOnline = item.ok === true || item.status === 200;
    if (mode === 'grid') {
        card.innerHTML = `
        <div class="d-flex justify-content-between">
            <div class="text-start d-flex align-items-start">
                <span class="status-dot-placeholder me-2"></span>
                <div>
                    <div class="fw-semibold">${item.name}</div>
                    <div class="text-muted small"><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a></div>
                </div>
            </div>
            <div class="text-end">
                ${item.status === 200 ? '<span class="badge bg-success">ONLINE</span>' : '<span class="badge bg-danger">OFFLINE</span>'}
                <div class="text-muted small mt-1">${item.last_checked}</div>
            </div>
        </div>
    `;
    } else {
        // list mode: more compact horizontal layout
        card.className = 'card shadow-sm p-2 mb-2';
        card.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
            <div class="text-start d-flex align-items-center">
                <span class="status-dot-placeholder me-2"></span>
                <div>
                    <div class="fw-semibold">${item.name}</div>
                    <div class="text-muted small"><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a></div>
                </div>
            </div>
            <div class="text-end">
                ${item.status === 200 ? '<span class="badge bg-success">ONLINE</span>' : '<span class="badge bg-danger">OFFLINE</span>'}
                <div class="text-muted small mt-1">${item.last_checked}</div>
            </div>
        </div>
    `;
    }
    // style border by status
    if (isOnline) {
        card.classList.add('border', 'border-2', 'border-success', 'bg-white');
    } else {
        card.classList.add('border', 'border-2', 'border-danger', 'bg-white');
    }
    // place status dot inside placeholder for consistent alignment
    const placeholder = card.querySelector('.status-dot-placeholder');
    if (placeholder) {
        placeholder.replaceWith(dot);
    } else {
        const d = card.querySelector('.d-flex');
        if (d) d.prepend(dot);
    }
    col.appendChild(card);
    return col;
}

function renderGrid(items) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    // if in list mode, render a table for tidy layout
    if (viewMode === 'list') {
        const table = document.createElement('table');
        table.className = 'table table-striped table-hover mb-0';
        table.innerHTML = `
            <thead>
                <tr>
                    <th style="width:56px">No</th>
                    <th>Name</th>
                    <th>URL</th>
                    <th class="text-end" style="width:120px">Status</th>
                    <th class="text-end" style="width:140px">Last Checked</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        items.forEach((item, idx) => {
            const tr = document.createElement('tr');
            const isOnline = item.ok === true || item.status === 200;
            const no = item.id ? item.id : (idx + 1);
            tr.innerHTML = `
                <td class="align-middle">${no}</td>
                <td class="align-middle">${item.name}</td>
                <td class="align-middle text-muted small"><a href="${item.url}" target="_blank" rel="noopener noreferrer" style="font-size:1rem;font-weight:500">${item.url}</a></td>
                <td class="align-middle text-end">${isOnline ? '<span class="badge bg-success">ONLINE</span>' : '<span class="badge bg-danger">OFFLINE</span>'}</td>
                <td class="align-middle text-end small">${item.last_checked}</td>
            `;
            tbody.appendChild(tr);
        });
        grid.appendChild(table);
        return;
    }

    // smooth layout: wrap in fragment
    const frag = document.createDocumentFragment();
    items.forEach(it => frag.appendChild(createCard(it, viewMode)));
    grid.appendChild(frag);
}

function renderStats(items, meta) {
    const stats = document.getElementById('stats');
    const online = items.filter(i => i.ok).length;
    const offline = items.length - online;
    stats.innerHTML = `
        <div class="d-flex gap-2 align-items-center">
            <div><span class="badge bg-success">ONLINE ${online}</span></div>
            <div><span class="badge bg-danger">OFFLINE ${offline}</span></div>
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

    // store last items to allow toggling view without re-fetch
    lastItems = items;
    lastMeta = meta;

    try {
        renderGrid(items);
        renderStats(items, meta);
    } catch (e) {
        console.error('Render error', e);
    }

    if (lastUpdated) {
        lastUpdated.textContent = 'Terakhir: ' + new Date().toLocaleString();
    }
    if (loadingEl) loadingEl.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRender);

    const btnGrid = document.getElementById('btnGrid');
    const btnList = document.getElementById('btnList');
    function setView(mode) {
        viewMode = mode === 'list' ? 'list' : 'grid';
        localStorage.setItem('monitoring_view', viewMode);
        if (btnGrid) btnGrid.classList.toggle('active', viewMode === 'grid');
        if (btnList) btnList.classList.toggle('active', viewMode === 'list');
        if (lastItems && lastItems.length) renderGrid(lastItems);
    }
    if (btnGrid) btnGrid.addEventListener('click', () => setView('grid'));
    if (btnList) btnList.addEventListener('click', () => setView('list'));

    // initialize view buttons state
    setView(viewMode);

    loadAndRender();
    setInterval(loadAndRender, 1000);
});

// Filter & sort logic
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
function getFilteredItems() {
    let items = lastItems || [];
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (q) {
        items = items.filter(i => (i.name || '').toLowerCase().includes(q) || (i.url || '').toLowerCase().includes(q));
    }
    const s = sortSelect ? sortSelect.value : 'default';
    if (s === 'online') items = items.filter(i => i.ok === true || i.status === 200);
    if (s === 'offline') items = items.filter(i => !(i.ok === true || i.status === 200));
    return items;
}

// attach handlers (defensive)
if (searchInput) {
    let timer = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            renderGrid(getFilteredItems());
        }, 200);
    });
}
if (sortSelect) {
    sortSelect.addEventListener('change', () => renderGrid(getFilteredItems()));
}
