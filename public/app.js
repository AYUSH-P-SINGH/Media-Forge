const API_BASE = '/api/v1/media';
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  setupUpload();
  setupFilters();
  setupModal();
  loadMedia();
  checkHealth();

  document.getElementById('btnRefresh').addEventListener('click', loadMedia);
  setInterval(loadMedia, 4000);
  setInterval(checkHealth, 8000);
});

async function checkHealth() {
  const pill = document.getElementById('healthPill');
  const text = document.getElementById('healthText');
  try {
    const res = await fetch('/healthz');
    const data = await res.json();
    if (data.status === 'ok') {
      pill.className = 'health-pill healthy';
      text.textContent = 'Live & Healthy';
    } else {
      pill.className = 'health-pill';
      text.textContent = 'Degraded';
    }
  } catch {
    pill.className = 'health-pill';
    text.textContent = 'Offline';
  }
}

function setupUpload() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      uploadFile(fileInput.files[0]);
    }
  });
}

async function uploadFile(file) {
  const progressContainer = document.getElementById('uploadProgress');
  const bar = document.getElementById('progressBar');
  const label = document.getElementById('progressLabel');

  progressContainer.classList.remove('hidden');
  bar.style.width = '30%';
  label.textContent = 'Uploading ' + file.name + '...';

  const formData = new FormData();
  formData.append('file', file);

  try {
    bar.style.width = '60%';
    const res = await fetch(API_BASE+ '/upload', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();


    if (result.success) {
      bar.style.width = '100%';
      label.textContent = 'Uploaded successfully!';
      setTimeout(() => {
        progressContainer.classList.add('hidden');
        bar.style.width = '0%';
      }, 1500);
      loadMedia();
    } else {
      alert('Upload failed: ' + (result.error || 'Unknown error'));
      progressContainer.classList.add('hidden');
    }
  } catch (err) {
    alert('Network error while uploading: ' + err.message);
    progressContainer.classList.add('hidden');
  }
}

async function loadMedia() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    if (data.success) {
      updateStats(data.stats);
      renderGrid(data.data);
    }
  } catch (e) {
    console.warn('Error fetching media:', e);
  }
}

function updateStats(stats) {
  if (!stats) return;
  document.getElementById('statTotal').textContent = stats.total || 0;
  document.getElementById('statQueued').textContent = stats.queued || 0;
  document.getElementById('statProcessing').textContent = stats.processing || 0;
  document.getElementById('statCompleted').textContent = stats.completed || 0;
  document.getElementById('catalogCount').textContent = (stats.total || 0) + ' items';
}

function setupFilters() {
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadMedia();
    });
  });
}

function renderGrid(items) {
  const grid = document.getElementById('mediaGrid');
  const emptyState = document.getElementById('emptyState');
  grid.innerHTML = '';

  const filtered = items.filter(item => {
    if (currentFilter === 'all') return true;
    return (item.mime_type || '').includes(currentFilter);
  });


  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'media-card';


    const thumbSrc = item.thumbnail_url || 'https://via.placeholder.com/300x180/0f172a/94a3b8?text=' + encodeURIComponent(item.original_name);
    const sizeMb = ((item.size_bytes || 0) / (1024 * 1024)).toFixed(2);

    card.innerHTML = `
      <div class="media-thumb-wrapper">
        <img class="media-thumb-img" src="${thumbSrc}" alt="${escapeHtml(item.original_name)}" />
        <span class="media-status-pill status-${item.status}">${item.status}</span>
      </div>
      <div class="media-body">
        <div class="media-name" title="${escapeHtml(item.original_name)}">${escapeHtml(item.original_name)}</div>
        <div class="media-meta-line">
          <span>${sizeMb} MB &bull; ${item.mime_type.split('/')[1] || 'file'}</span>
          <span>${new Date(item.created_at).toLocaleTimeString([], { hour: '2digit', minute: '2digit' })}</span>
        </div>
        <div class="media-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="viewMetadata('${item.id}')">Details</button>
          <button class="btn btn-secondary btn-sm" onclick="reprocessMedia('${item.id}')" title="Reprocess">? Process</button>
          <button class="btn btn-secondary btn-sm" onclick="deleteMedia('${item.id}')" title="Delete" style="color:#f43f5e;">&times;</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.viewMetadata = async function(id) {
  try {
    const res = await fetch(API_BASE + '/' + id);
    const result = await res.json();
    if (result.success && result.data) {
      const item = result.data;
      const metaGrid = document.getElementById('modalMetaGrid');
      metaGrid.innerHTML = `
        <div class="meta-box"><div class="meta-box-label">Asset ID</div><div class="meta-box-value">${item.id}</div></div>
        <div class="meta-box"><div class="meta-box-label">Status</div><div class="meta-box-value">${item.status}</div></div>
        <div class="meta-box"><div class="meta-box-label">File Type</div><div class="meta-box-value">${item.mime_type}</div></div>
        <div class="meta-box"><div class="meta-box-label">Size</div><div class="meta-box-value">${(item.size_bytes / 1024).toFixed(1)} KB</div></div>
      `;
      document.getElementById('modalJson').textContent = JSON.stringify(item, null, 2);
      document.getElementById('metadataModal').classList.remove('hidden');
    }
  } catch (e) {
    alert('Error loading details: ' + e.message);
  }
};

window.reprocessMedia = async function(id) {
  try {
    const res = await fetch(API_BASE + '/' + id + '/process', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      loadMedia();
    }
  } catch (e) {
    alert('Reprocess error: ' + e.message);
  }
};

window.deleteMedia = async function(id) {
  if (!confirm('Are you sure you want to remove this media asset?')) return;
  try {
    const res = await fetch(API_BASE + '/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadMedia();
    }
  } catch (e) {
    alert('Delete error: ' + e.message);
  }
};

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('metadataModal').classList.add('hidden');
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
