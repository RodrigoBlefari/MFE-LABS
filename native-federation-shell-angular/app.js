const els = {
  cardsGrid: document.getElementById('cards-grid'),
  quickNav: document.getElementById('quick-nav'),
  telemetryBody: document.getElementById('telemetry-body'),
  previewGrid: document.getElementById('preview-grid'),
  selectedCount: document.getElementById('selected-count'),
  busCount: document.getElementById('bus-count'),

  stageTitle: document.getElementById('stage-title'),
  stageSubtitle: document.getElementById('stage-subtitle'),
  stageOutlet: document.getElementById('stage-outlet'),
  stageStatus: document.getElementById('stage-status'),
  sectionHead: document.querySelector('.section-head'),

  btnOpenOverview: document.getElementById('btn-open-overview'),
  btnOpenBus: document.getElementById('btn-open-bus'),
  btnBusTest: document.getElementById('btn-bus-test'),
  btnClearStage: document.getElementById('btn-clear-stage'),
  btnSelectAll: document.getElementById('btn-select-all'),
  btnSelectNone: document.getElementById('btn-select-none'),
  btnLoadPreview: document.getElementById('btn-load-preview'),
  btnClearPreview: document.getElementById('btn-clear-preview'),

  modalBackdrop: document.getElementById('modal-backdrop'),
  modalTitle: document.getElementById('modal-title'),
  modalContent: document.getElementById('modal-content'),
  modalClose: document.querySelector('[data-close-modal]'),
};

// Diagnóstico de bundling
window.__bundleDebug = {};

const REMOTE_MANIFEST_ENV =
  new URLSearchParams(window.location.search).get('env') ||
  window.localStorage.getItem('mfe-env') ||
  'dev';

const manifestCandidates = {
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
  {
    id: 'nf',
    label: 'Native Federation',
    tagline: 'ESM puro e contrato simples',
    doc: 'MFE base usando módulos ES nativos e BUS para troca de eventos.',
  },
  {
    id: 'mf',
    label: 'Module Federation',
    tagline: 'Remote webpack com bridge',
    doc: 'Remote empacotado com webpack, consumido no shell via import dinâmico.',
  },
  {
    id: 'ssa',
    label: 'Single-SPA',
    tagline: 'Adapter de lifecycle legado',
    doc: 'Compatibiliza bootstrap/mount/unmount com o shell atual.',
  },
  {
    id: 'ng',
    label: 'Angular 15 Element',
    tagline: 'Custom element leve',
    doc: 'Web component Angular com ciclo de vida controlado.',
  },
  {
    id: 'ng-full',
    label: 'Angular 20 Full',
    tagline: 'Aplicação Angular completa',
    doc: 'Build completo servido em porta dedicada e integrado por bridge.',
  },
  {
    id: 'react',
    label: 'React 18',
    tagline: 'Widget isolado de observabilidade',
    doc: 'Componente React com integração desacoplada no shell.',
  },
  {
    id: 'vue',
    label: 'Vue 3',
    tagline: 'Custom element com BUS',
    doc: 'Componente Vue com comunicação por evento e montagem segura.',
  },
];

const selectedSet = new Set(registry.map((r) => r.id));
const telemetry = new Map();
const previewLifecycles = new Map();

let activeStage = { id: null, lifecycle: null };
let previewLoadToken = 0;

window.__busLogs = window.__busLogs || [];

function getRemoteUrl(id) {
  return runtimeRemotes[id] || defaultRemotes[id];
}

function withTimeout(promise, ms, ctx) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout (${ms}ms) em ${ctx}`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function formatMs(value) {
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} ms` : '--';
}

function updateBusCount() {
  if (!els.busCount) return;
  els.busCount.textContent = String((window.__busLogs || []).length);
}

function trackBus(event) {
  window.__busLogs.push({
    at: new Date().toLocaleTimeString('pt-BR'),
    detail: event?.detail || {},
  });
  if (window.__busLogs.length > 80) window.__busLogs.shift();
  updateBusCount();
}

function toBusHtml() {
  const logs = (window.__busLogs || []).slice(-20).reverse();
  if (!logs.length) {
    return '<p>Nenhum evento BUS registrado.</p>';
  }
  return `
    <ul>
      ${logs
        .map(
          (l) => `<li><strong>${l.at}</strong><pre><code>${JSON.stringify(l.detail, null, 2)}</code></pre></li>`,
        )
        .join('')}
    </ul>
  `;
}

function openModal(title, html) {
  if (!els.modalBackdrop || !els.modalTitle || !els.modalContent) return;
  els.modalTitle.textContent = title || 'Detalhes';
  els.modalContent.innerHTML = html || '';
  els.modalBackdrop.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!els.modalBackdrop || !els.modalTitle || !els.modalContent) return;
  els.modalBackdrop.hidden = true;
  els.modalTitle.textContent = 'Detalhes';
  els.modalContent.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function renderSelectedCount() {
  if (!els.selectedCount) return;
  els.selectedCount.textContent = `${selectedSet.size} selecionado(s)`;
}

function updateTelemetry(id, duration, bundleSize = 0) {
  const current = telemetry.get(id) || { count: 0, total: 0, last: 0, best: Infinity, worst: 0, bundle: bundleSize };
  current.count += 1;
  current.total += duration;
  current.last = duration;
  current.best = Math.min(current.best, duration);
  current.worst = Math.max(current.worst, duration);
  if (bundleSize > 0) current.bundle = bundleSize;
  telemetry.set(id, current);
  renderTelemetry();
}

function formatKb(bytes) {
  return bytes > 0 ? `${(bytes / 1024).toFixed(1)} KB` : '--';
}

function renderTelemetry() {
  if (!els.telemetryBody) return;
  
  const allEntries = registry.map((mfe) => {
    const entry = telemetry.get(mfe.id);
    const avg = entry?.count ? entry.total / entry.count : 0;
    return { mfe, entry, avg };
  });
  
  const globalAvg = allEntries.reduce((sum, e) => sum + (e.avg || 0), 0) / allEntries.length || 0;
  const globalBest = Math.min(...allEntries.map(e => e.entry?.best || Infinity).filter(v => v !== Infinity));
  const globalWorst = Math.max(...allEntries.map(e => e.entry?.worst || 0));
  const totalBundle = allEntries.reduce((sum, e) => sum + (e.entry?.bundle || 0), 0);
  const totalMounts = allEntries.reduce((sum, e) => sum + (e.entry?.count || 0), 0);
  
  els.telemetryBody.innerHTML = registry
    .map((mfe) => {
      const entry = telemetry.get(mfe.id);
      const avg = entry?.count ? entry.total / entry.count : 0;
      const klass = avg > 1200 ? 'warn' : avg > 800 ? 'caution' : 'ok';
      return `
        <tr>
          <td><strong>${mfe.label}</strong></td>
          <td class="${klass}">${formatMs(avg)}</td>
          <td>${formatMs(entry?.best || 0)}</td>
          <td>${formatMs(entry?.worst || 0)}</td>
          <td>${entry?.count || 0}</td>
          <td>${formatKb(entry?.bundle || 0)}</td>
        </tr>
      `;
    })
    .join('') + `
      <tr class="telemetry-summary">
        <td><strong>Resumo</strong></td>
        <td class="${globalAvg > 1200 ? 'warn' : globalAvg > 800 ? 'caution' : 'ok'}">${formatMs(globalAvg)}</td>
        <td>${formatMs(globalBest === Infinity ? 0 : globalBest)}</td>
        <td>${formatMs(globalWorst)}</td>
        <td>${totalMounts}</td>
        <td>${formatKb(totalBundle)}</td>
      </tr>
    `;
}

function normalizeLifecycle(mod, candidate, props) {
  if (typeof candidate === 'function') return { destroy: async () => candidate() };
  if (candidate && typeof candidate.destroy === 'function') return { destroy: async () => candidate.destroy() };
  if (candidate && typeof candidate.teardown === 'function') return { destroy: async () => candidate.teardown() };
  if (typeof mod.unmount === 'function') return { destroy: async () => mod.unmount(props) };
  return { destroy: async () => { if (props?.outlet) props.outlet.innerHTML = ''; } };
}

async function mountRemote(mfe, outlet) {
  const url = getRemoteUrl(mfe.id);
  const started = performance.now();

  let bundleSize = 0;
  try {
    // Tenta obter size via fetch HEAD primeiro
    let headRes = await fetch(url, { method: 'HEAD' });
    let cl = headRes.headers.get('content-length');
    if (cl) {
      bundleSize = parseInt(cl, 10);
    } else {
      // Se HEAD não retornar, faz GET completo e mede blob
      const getRes = await fetch(url);
      if (getRes.ok) {
        cl = getRes.headers.get('content-length');
        if (cl) {
          bundleSize = parseInt(cl, 10);
        } else {
          const blob = await getRes.blob();
          bundleSize = blob.size;
        }
      }
    }
    console.log(`[shell] bundle ${mfe.id}: ${bundleSize} bytes`);
  } catch (err) {
    console.warn(`[shell] falha ao obter tamanho do bundle ${mfe.id}`, err);
  }

  const mod = await withTimeout(import(url), IMPORT_TIMEOUT_MS, `import ${mfe.id}`);
  const props = {
    host: 'native-federation-shell',
    name: mfe.id,
    id: mfe.id,
    outlet,
    replace: true,
  };

  let candidate = null;
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
  updateTelemetry(mfe.id, duration, bundleSize);
  return normalizeLifecycle(mod, candidate, props);
}

async function clearStage() {
  if (activeStage.lifecycle?.destroy) {
    try {
      await withTimeout(activeStage.lifecycle.destroy(), DESTROY_TIMEOUT_MS, `destroy stage ${activeStage.id || ''}`);
    } catch (err) {
      console.warn('[shell] falha ao destruir stage', err);
    }
  }
  activeStage = { id: null, lifecycle: null };
  if (els.stageOutlet) els.stageOutlet.innerHTML = '';
  if (els.stageTitle) els.stageTitle.textContent = 'Nenhum MFE ativo';
  if (els.stageSubtitle) els.stageSubtitle.textContent = 'Escolha um card para montar no palco.';
  if (els.stageStatus) els.stageStatus.textContent = 'Pronto para montar.';
}

function toggleStageCollapse() {
  if (!els.stageOutlet) return;
  els.stageOutlet.classList.toggle('collapsed');
}

async function activateStage(id) {
  const mfe = registry.find((r) => r.id === id);
  if (!mfe || !els.stageOutlet) return;

  await clearStage();
  if (els.stageTitle) els.stageTitle.textContent = `${mfe.label} ativo no palco`;
  if (els.stageSubtitle) els.stageSubtitle.textContent = mfe.tagline;
  if (els.stageStatus) els.stageStatus.textContent = `Carregando ${mfe.label}...`;
  
  // Expande o outlet ao carregar novo MFE
  if (els.stageOutlet.classList.contains('collapsed')) {
    els.stageOutlet.classList.remove('collapsed');
  }

  try {
    const lifecycle = await mountRemote(mfe, els.stageOutlet);
    activeStage = { id: mfe.id, lifecycle };
    if (els.stageStatus) els.stageStatus.textContent = `${mfe.label} montado com sucesso.`;
  } catch (error) {
    console.error(`[shell] erro stage ${mfe.id}`, error);
    if (els.stageStatus) els.stageStatus.textContent = `${mfe.label} falhou (erro/timeout).`;
  }
}

async function clearPreviews() {
  previewLoadToken += 1;

  const destroys = [...previewLifecycles.entries()].map(async ([id, lifecycle]) => {
    try {
      await withTimeout(lifecycle?.destroy?.(), DESTROY_TIMEOUT_MS, `destroy preview ${id}`);
    } catch (err) {
      console.warn(`[shell] falha destroy preview ${id}`, err);
    }
  });
  await Promise.allSettled(destroys);
  previewLifecycles.clear();

  if (els.previewGrid) {
    els.previewGrid.innerHTML = '<p class="preview-empty">Nenhum preview carregado.</p>';
  }
}

async function loadPreviews() {
  if (!els.previewGrid) return;
  previewLoadToken += 1;
  const token = previewLoadToken;

  await clearPreviews();
  if (token !== previewLoadToken) return;

  const selected = registry.filter((mfe) => selectedSet.has(mfe.id));
  if (!selected.length) {
    els.previewGrid.innerHTML = '<p class="preview-empty">Selecione ao menos 1 MFE.</p>';
    return;
  }

  els.previewGrid.innerHTML = '';

  const renderMap = new Map();
  selected.forEach((mfe) => {
    const card = document.createElement('article');
    card.className = 'preview-card';
    card.innerHTML = `
      <div class="preview-title">
        <strong>${mfe.label}</strong>
        <span class="preview-status loading" data-status="${mfe.id}">Carregando</span>
      </div>
      <div id="preview-outlet-${mfe.id}" class="preview-outlet"></div>
    `;
    els.previewGrid.appendChild(card);
    renderMap.set(mfe.id, {
      outlet: card.querySelector(`#preview-outlet-${mfe.id}`),
      status: card.querySelector(`[data-status="${mfe.id}"]`),
    });
  });

  await Promise.allSettled(
    selected.map(async (mfe) => {
      if (token !== previewLoadToken) return;
      const ui = renderMap.get(mfe.id);
      if (!ui?.outlet || !ui?.status) return;
      try {
        const lifecycle = await mountRemote(mfe, ui.outlet);
        previewLifecycles.set(mfe.id, lifecycle);
        ui.status.textContent = 'OK';
        ui.status.className = 'preview-status ok';
      } catch (error) {
        console.error(`[shell] erro preview ${mfe.id}`, error);
        ui.outlet.innerHTML = '<p class="muted">Falha/timeout ao montar.</p>';
        ui.status.textContent = 'Erro';
        ui.status.className = 'preview-status error';
      }
    }),
  );
}

function renderQuickNav() {
  if (!els.quickNav) return;
  els.quickNav.innerHTML = '';
  registry.forEach((mfe) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = mfe.label;
    btn.addEventListener('click', () => {
      void activateStage(mfe.id);
    });
    els.quickNav.appendChild(btn);
  });
}

function renderCards() {
  if (!els.cardsGrid) return;
  els.cardsGrid.innerHTML = '';

  registry.forEach((mfe) => {
    const card = document.createElement('article');
    card.className = 'mfe-card';
    card.innerHTML = `
      <div class="mfe-card-head">
        <div>
          <h3 class="mfe-card-title">${mfe.label}</h3>
          <p class="mfe-card-description">${mfe.tagline}</p>
        </div>
        <label class="checkline">
          <input type="checkbox" ${selectedSet.has(mfe.id) ? 'checked' : ''} />
          Preview
        </label>
      </div>
      <div class="mfe-card-actions">
        <button type="button" class="btn btn-primary" data-action="stage">Abrir no palco</button>
        <button type="button" class="btn" data-action="docs">Docs</button>
        <button type="button" class="btn" data-action="bus">BUS</button>
      </div>
    `;

    const checkbox = card.querySelector('input[type="checkbox"]');
    checkbox?.addEventListener('change', () => {
      if (checkbox.checked) selectedSet.add(mfe.id);
      else selectedSet.delete(mfe.id);
      renderSelectedCount();
    });

    card.querySelector('[data-action="stage"]')?.addEventListener('click', () => {
      void activateStage(mfe.id);
    });

    card.querySelector('[data-action="docs"]')?.addEventListener('click', () => {
      openModal(
        `Docs · ${mfe.label}`,
        `
          <h3>${mfe.label}</h3>
          <p>${mfe.doc}</p>
          <h3>Remote atual</h3>
          <pre><code>${getRemoteUrl(mfe.id)}</code></pre>
        `,
      );
    });

    card.querySelector('[data-action="bus"]')?.addEventListener('click', () => {
      openModal(`BUS · ${mfe.label}`, toBusHtml());
    });

    els.cardsGrid.appendChild(card);
  });
}

async function loadManifest() {
  const file = manifestCandidates[REMOTE_MANIFEST_ENV] || manifestCandidates.dev;
  try {
    const res = await fetch(file);
    if (!res.ok) return;
    const payload = await res.json();
    if (payload?.remotes && typeof payload.remotes === 'object') {
      runtimeRemotes = { ...defaultRemotes, ...payload.remotes };
      window.localStorage.setItem('mfe-env', payload.env || REMOTE_MANIFEST_ENV);
    }
  } catch (error) {
    console.warn('[shell] manifest indisponível, usando defaults', error);
  }
}

function wireEvents() {
  window.addEventListener('BUS', trackBus);

  els.sectionHead?.addEventListener('click', () => {
    toggleStageCollapse();
  });

  els.btnOpenOverview?.addEventListener('click', () => {
    openModal(
      'Visão geral do shell',
      `
        <h3>Objetivo</h3>
        <p>Organizar os MFEs com foco, previsibilidade e baixo acoplamento.</p>
        <h3>Decisões desta versão</h3>
        <ul>
          <li>Sem auto-carga pesada no boot.</li>
          <li>Previews sob demanda (clique em “Carregar previews”).</li>
          <li>Timeout e fallback por remote.</li>
          <li>Modal e BUS preservados.</li>
        </ul>
      `,
    );
  });

  els.btnOpenBus?.addEventListener('click', () => {
    openModal('Eventos BUS', toBusHtml());
  });

  els.btnBusTest?.addEventListener('click', () => {
    window.dispatchEvent(
      new CustomEvent('BUS', {
        detail: {
          id: 'shell',
          name: 'SHELL-PING',
          at: new Date().toISOString(),
        },
      }),
    );
  });

  els.btnClearStage?.addEventListener('click', () => {
    void clearStage();
  });

  els.btnSelectAll?.addEventListener('click', () => {
    registry.forEach((m) => selectedSet.add(m.id));
    renderCards();
    renderSelectedCount();
  });

  els.btnSelectNone?.addEventListener('click', () => {
    selectedSet.clear();
    renderCards();
    renderSelectedCount();
  });

  els.btnLoadPreview?.addEventListener('click', () => {
    void loadPreviews();
  });

  els.btnClearPreview?.addEventListener('click', () => {
    void clearPreviews();
  });

  els.modalClose?.addEventListener('click', closeModal);

  els.modalBackdrop?.addEventListener('click', (event) => {
    if (event.target === els.modalBackdrop) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !els.modalBackdrop?.hidden) {
      closeModal();
    }
  });
}

async function init() {
  await loadManifest();
  wireEvents();
  renderTelemetry();
  renderQuickNav();
  renderCards();
  renderSelectedCount();
  updateBusCount();
}

init().catch((error) => {
  console.error('[shell] init error', error);
  if (els.stageStatus) {
    els.stageStatus.textContent = 'Falha ao inicializar shell.';
  }
});
