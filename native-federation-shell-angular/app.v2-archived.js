const els = {
  cardsGrid: document.getElementById('cards-grid'),
  galleryGrid: document.getElementById('gallery-grid'),
  selectedCount: document.getElementById('selected-count'),
  quickNav: document.getElementById('quick-nav'),
  stageTitle: document.getElementById('stage-title'),
  stageSubtitle: document.getElementById('stage-subtitle'),
  stageOutlet: document.getElementById('stage-outlet'),
  stageStatus: document.getElementById('stage-status'),
  telemetryBody: document.getElementById('telemetry-body'),
  btnOverview: document.getElementById('btn-open-overview'),
  btnClearStage: document.getElementById('btn-clear-stage'),
  btnSelectAll: document.getElementById('btn-select-all'),
  btnSelectNone: document.getElementById('btn-select-none'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  modalTitle: document.getElementById('modal-title'),
  modalContent: document.getElementById('modal-content'),
  modalClose: document.querySelector('[data-close-modal]'),
};

const REMOTE_MANIFEST_ENV =
  new URLSearchParams(window.location.search).get('env') ||
  window.localStorage.getItem('mfe-env') ||
  'dev';

const remoteManifestCandidates = {
  dev: './remotes.dev.json',
  hml: './remotes.hml.json',
  prod: './remotes.prod.json',
};

const defaultRemotes = {
  nf: 'http://localhost:9101/mfe1.js',
  mf: 'http://localhost:9301/remote-a.js',
  ssa: 'http://localhost:9302/mfe-a.js',
  ng: 'http://localhost:9310/mfe-ng.js',
  'ng-full': 'http://localhost:9400/mfe-ng-full.js',
  react: 'http://localhost:9201/mfe-react.js',
  vue: 'http://localhost:9001/mfe-vue.js',
};

let runtimeRemotes = { ...defaultRemotes };
const IMPORT_TIMEOUT_MS = 7000;
const MOUNT_TIMEOUT_MS = 9000;
const DESTROY_TIMEOUT_MS = 4000;

const registry = [
  { id: 'nf', label: 'Native Federation', tagline: 'ESM puro + BUS para desacoplamento.' },
  { id: 'mf', label: 'Module Federation', tagline: 'Remote webpack integrado ao shell.' },
  { id: 'ssa', label: 'Single-SPA', tagline: 'Legacy adapter com mount/unmount seguro.' },
  { id: 'ng', label: 'Angular 15 Element', tagline: 'Custom element Angular leve.' },
  { id: 'ng-full', label: 'Angular 20 Full', tagline: 'App Angular completa em web component.' },
  { id: 'react', label: 'React 18', tagline: 'Widget React com telemetria de render.' },
  { id: 'vue', label: 'Vue 3', tagline: 'Custom element Vue com BUS.' },
];

const docs = {
  overview: `
    <h3>Objetivo da Home</h3>
    <p>Organizar o laboratório em uma experiência limpa: palco único para foco + vitrine paralela para comparação.</p>
    <h3>Como funciona</h3>
    <ul>
      <li><strong>Palco principal:</strong> monta 1 MFE por vez para debug e demo.</li>
      <li><strong>Vitrine:</strong> mostra os selecionados ao mesmo tempo.</li>
      <li><strong>BUS:</strong> eventos desacoplados via <code>CustomEvent('BUS')</code>.</li>
      <li><strong>Telemetria:</strong> registra média, último, melhor e pior tempo de montagem.</li>
    </ul>
  `,
  nf: `<h3>Native Federation</h3><p>Peça base ESM, integração sem bundler compartilhado.</p>`,
  mf: `<h3>Module Federation</h3><p>Remote webpack carregado por import dinâmico.</p>`,
  ssa: `<h3>Single-SPA</h3><p>Compatibilização de lifecycle legado no shell novo.</p>`,
  ng: `<h3>Angular 15 Element</h3><p>Componente web com ciclo de vida controlado.</p>`,
  'ng-full': `<h3>Angular 20 Full</h3><p>Build completo servido em 9400, com bridge para o shell.</p>`,
  react: `<h3>React 18</h3><p>Componente React isolado com medição de render.</p>`,
  vue: `<h3>Vue 3</h3><p>Elemento Vue consumido de forma desacoplada.</p>`,
};

const selectedSet = new Set(registry.map((item) => item.id));
const telemetry = new Map();
const galleryLifecycles = new Map();
let activeStage = { id: null, lifecycle: null };

window.__busLogs = window.__busLogs || [];
window.addEventListener('BUS', (event) => {
  window.__busLogs.push({ at: new Date().toLocaleTimeString('pt-BR'), detail: event.detail || {} });
  if (window.__busLogs.length > 50) window.__busLogs.shift();
});

function getRemoteUrl(id) {
  return runtimeRemotes[id] || defaultRemotes[id];
}

function withTimeout(promise, ms, context) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout (${ms}ms) em ${context}`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function loadRemoteManifest() {
  const file = remoteManifestCandidates[REMOTE_MANIFEST_ENV] || remoteManifestCandidates.dev;
  try {
    const res = await fetch(file);
    if (!res.ok) return;
    const payload = await res.json();
    if (payload?.remotes && typeof payload.remotes === 'object') {
      runtimeRemotes = { ...defaultRemotes, ...payload.remotes };
      window.localStorage.setItem('mfe-env', payload.env || REMOTE_MANIFEST_ENV);
    }
  } catch (error) {
    console.warn('[shell] manifest indisponível, usando default', error);
  }
}

function formatMs(value) {
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} ms` : '--';
}

function updateTelemetry(id, duration) {
  const current = telemetry.get(id) || { count: 0, total: 0, last: 0, best: Infinity, worst: 0 };
  current.count += 1;
  current.total += duration;
  current.last = duration;
  current.best = Math.min(current.best, duration);
  current.worst = Math.max(current.worst, duration);
  telemetry.set(id, current);
  renderTelemetry();
}

function renderTelemetry() {
  if (!els.telemetryBody) return;
  els.telemetryBody.innerHTML = registry.map((mfe) => {
    const entry = telemetry.get(mfe.id);
    const average = entry?.count ? entry.total / entry.count : 0;
    const averageClass = average > 1200 ? 'warn' : 'ok';
    return `
      <tr>
        <td>${mfe.label}</td>
        <td class="${averageClass}">${formatMs(average)}</td>
        <td>${formatMs(entry?.last || 0)}</td>
        <td>${formatMs(entry?.best === Infinity ? 0 : entry?.best || 0)}</td>
        <td>${formatMs(entry?.worst || 0)}</td>
        <td>${entry?.count || 0}</td>
      </tr>
    `;
  }).join('');
}

function normalizeLifecycle(mod, candidate, props) {
  if (typeof candidate === 'function') return { destroy: async () => candidate() };
  if (candidate && typeof candidate.destroy === 'function') return { destroy: async () => candidate.destroy() };
  if (candidate && typeof candidate.teardown === 'function') return { destroy: async () => candidate.teardown() };
  if (typeof mod.unmount === 'function') return { destroy: async () => mod.unmount(props) };
  return {
    destroy: async () => {
      if (props?.outlet) props.outlet.innerHTML = '';
    },
  };
}

async function mountRemote(mfe, outlet) {
  const url = getRemoteUrl(mfe.id);
  const started = performance.now();
  const mod = await withTimeout(import(url), IMPORT_TIMEOUT_MS, `import ${mfe.id}`);

  let candidate = null;
  const props = { host: 'native-federation-shell', name: mfe.id, id: mfe.id, outlet, replace: true };

  if (typeof mod.render === 'function') {
    candidate = await withTimeout(mod.render(outlet, props), MOUNT_TIMEOUT_MS, `render ${mfe.id}`);
  } else if (typeof mod.mount === 'function') {
    if (typeof mod.bootstrap === 'function') {
      await withTimeout(mod.bootstrap(props), MOUNT_TIMEOUT_MS, `bootstrap ${mfe.id}`);
    }
    candidate = await withTimeout(mod.mount(props), MOUNT_TIMEOUT_MS, `mount ${mfe.id}`);
  } else if (typeof mod.default === 'function') {
    candidate = await withTimeout(mod.default(outlet, props), MOUNT_TIMEOUT_MS, `default ${mfe.id}`);
  }

  const duration = performance.now() - started;
  updateTelemetry(mfe.id, duration);
  return normalizeLifecycle(mod, candidate, props);
}

async function clearStage() {
  if (activeStage.lifecycle?.destroy) {
    try {
      await withTimeout(activeStage.lifecycle.destroy(), DESTROY_TIMEOUT_MS, `destroy stage ${activeStage.id || ''}`);
    } catch (error) {
      console.warn('[shell] timeout ao limpar palco, seguindo fluxo', error);
    }
  }
  activeStage = { id: null, lifecycle: null };
  els.stageTitle.textContent = 'Selecione um MFE para montar';
  els.stageSubtitle.textContent = 'O shell monta 1 por vez aqui para debug e demonstracoes focadas.';
  els.stageStatus.textContent = 'Nenhum MFE ativo no palco.';
  els.stageOutlet.innerHTML = '';
}

async function activateStage(id) {
  const mfe = registry.find((item) => item.id === id);
  if (!mfe) return;

  await clearStage();
  els.stageTitle.textContent = `${mfe.label} ativo no palco`;
  els.stageSubtitle.textContent = mfe.tagline;
  els.stageStatus.textContent = `Carregando ${mfe.label}...`;

  try {
    const lifecycle = await mountRemote(mfe, els.stageOutlet);
    activeStage = { id: mfe.id, lifecycle };
    els.stageStatus.textContent = `${mfe.label} montado com sucesso.`;
  } catch (error) {
    console.error(`[shell] falha ao montar ${mfe.id}`, error);
    els.stageStatus.textContent = `Erro ao montar ${mfe.label}. Veja o console.`;
  }
}

function openModal(title, content) {
  els.modalTitle.textContent = title;
  els.modalContent.innerHTML = content;
  els.modalBackdrop.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  els.modalBackdrop.hidden = true;
  els.modalTitle.textContent = '';
  els.modalContent.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function renderSelectedCount() {
  els.selectedCount.textContent = `${selectedSet.size} selecionado(s)`;
}

async function renderGallery() {
  const toUnmount = [...galleryLifecycles.keys()].filter((id) => !selectedSet.has(id));
  for (const id of toUnmount) {
    const lifecycle = galleryLifecycles.get(id);
    try {
      if (lifecycle?.destroy) {
        await withTimeout(lifecycle.destroy(), DESTROY_TIMEOUT_MS, `destroy gallery ${id}`);
      }
    } catch (error) {
      console.warn(`[shell] falha ao destruir ${id}`, error);
    }
    galleryLifecycles.delete(id);
  }

  els.galleryGrid.innerHTML = '';

  const selected = registry.filter((mfe) => selectedSet.has(mfe.id));
  const outlets = new Map();
  for (const mfe of selected) {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    card.innerHTML = `
      <strong>${mfe.label}</strong>
      <div class="gallery-outlet" id="gallery-outlet-${mfe.id}"></div>
    `;
    els.galleryGrid.appendChild(card);
    const outlet = card.querySelector(`#gallery-outlet-${mfe.id}`);
    outlets.set(mfe.id, outlet);
  }

  await Promise.allSettled(
    selected.map(async (mfe) => {
      const outlet = outlets.get(mfe.id);
      if (!outlet) return;
      try {
        const lifecycle = await mountRemote(mfe, outlet);
        galleryLifecycles.set(mfe.id, lifecycle);
      } catch (error) {
        outlet.innerHTML = '<p style="color:#fb7185">Falha/timeout ao montar.</p>';
        console.error(`[shell] galeria ${mfe.id}`, error);
      }
    }),
  );
}

function renderQuickNav() {
  els.quickNav.innerHTML = '';
  registry.forEach((mfe) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = mfe.label;
    btn.addEventListener('click', () => void activateStage(mfe.id));
    els.quickNav.appendChild(btn);
  });
}

function openBusLog(id) {
  const logs = (window.__busLogs || []).filter((entry) => {
    const tag = `${entry?.detail?.id || entry?.detail?.name || entry?.detail?.source || ''}`.toLowerCase();
    return !id || tag.includes(id.toLowerCase());
  });

  const html = logs.length
    ? `<ul>${logs.slice(-12).map((entry) => `<li><strong>${entry.at}</strong> · <code>${JSON.stringify(entry.detail)}</code></li>`).join('')}</ul>`
    : '<p>Nenhum evento BUS registrado ainda.</p>';

  openModal('BUS · últimos eventos', html);
}

function renderCards() {
  els.cardsGrid.innerHTML = '';
  registry.forEach((mfe) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-head">
        <h3 class="card-title">${mfe.label}</h3>
        <label class="checkline"><input type="checkbox" ${selectedSet.has(mfe.id) ? 'checked' : ''} /> vitrine</label>
      </div>
      <small>${mfe.tagline}</small>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" data-action="stage">Abrir no palco</button>
        <button type="button" class="btn" data-action="docs">Docs</button>
        <button type="button" class="btn" data-action="bus">BUS</button>
      </div>
    `;

    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedSet.add(mfe.id);
      else selectedSet.delete(mfe.id);
      renderSelectedCount();
      void renderGallery();
    });

    card.querySelector('[data-action="stage"]').addEventListener('click', () => void activateStage(mfe.id));
    card.querySelector('[data-action="docs"]').addEventListener('click', () => openModal(`Docs · ${mfe.label}`, docs[mfe.id] || docs.overview));
    card.querySelector('[data-action="bus"]').addEventListener('click', () => openBusLog(mfe.id));

    els.cardsGrid.appendChild(card);
  });
}

function wireEvents() {
  els.btnOverview?.addEventListener('click', () => openModal('Visão geral do shell', docs.overview));
  els.btnClearStage?.addEventListener('click', () => void clearStage());
  els.btnSelectAll?.addEventListener('click', () => {
    registry.forEach((mfe) => selectedSet.add(mfe.id));
    renderCards();
    renderSelectedCount();
    void renderGallery();
  });
  els.btnSelectNone?.addEventListener('click', () => {
    selectedSet.clear();
    renderCards();
    renderSelectedCount();
    void renderGallery();
  });
  els.modalClose?.addEventListener('click', closeModal);
  els.modalBackdrop?.addEventListener('click', (event) => {
    if (event.target === els.modalBackdrop) closeModal();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.modalBackdrop.hidden) closeModal();
  });
}

async function init() {
  await loadRemoteManifest();
  wireEvents();
  renderCards();
  renderQuickNav();
  renderSelectedCount();
  renderTelemetry();
  void renderGallery();
}

init().catch((error) => {
  console.error('[shell] init error', error);
  if (els.stageStatus) els.stageStatus.textContent = 'Falha ao inicializar shell.';
});
