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
  btnRefreshAll: document.getElementById('btn-refresh-all'),
  btnClearCache: document.getElementById('btn-clear-cache'),
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
const bundleSizeCache = new Map();
const urlSizeCache = new Map();
const runtimeInsightsCache = new Map();

const REMOTE_MANIFEST_ENV =
  new URLSearchParams(window.location.search).get('env') ||
  window.localStorage.getItem('mfe-env') ||
  'dev';

const manifestCandidates = {
  dev: './remotes.dev.json',
  hml: './remotes.hml.json',
  prod: './remotes.prod.json',
  public: './remotes.public.json',
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
    label: 'Angular 20 Native Federation',
    tagline: 'ESM + Shared dependencies automático',
    doc: 'Angular 20 com @angular-architects/native-federation. Compartilhamento automático de dependências.',
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

function escapeHtml(value) {
  return String(value ?? '--')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function detectExportContract(mod) {
  if (!mod || typeof mod !== 'object') return '--';
  if (typeof mod.render === 'function') return 'render(outlet, props)';
  if (typeof mod.bootstrap === 'function' && typeof mod.mount === 'function') return 'bootstrap + mount';
  if (typeof mod.mount === 'function') return 'mount(props)';
  if (typeof mod.default === 'function') return 'default(outlet, props)';
  const names = Object.keys(mod).slice(0, 3);
  return names.length ? `exports: ${names.join(', ')}` : '--';
}

function classifyRemoteEntry(remoteUrl, mod, debug = {}) {
  const file = (() => {
    try {
      const u = new URL(remoteUrl);
      return u.pathname.split('/').pop() || remoteUrl;
    } catch {
      return remoteUrl;
    }
  })();

  const contract = detectExportContract(mod);
  const localRefs = Array.isArray(debug.localRefs) ? debug.localRefs : [];
  const hasRuntimeChunks = localRefs.some((u) => /main\.js|polyfills\.js|runtime/i.test(u));

  if (file === 'remoteEntry.js') return `remoteEntry.js (MF classic) · ${contract}`;
  if (file.includes('mfe-ng-full.js') && hasRuntimeChunks) return `Bridge ${file} + chunks Angular runtime`;
  if (file.includes('remote-a.js')) return `Remote ${file} (MF adapter ESM)`;
  if (file.includes('mfe-a.js')) return `Remote ${file} (Single-SPA adapter)`;
  if (file.includes('mfe-ng.js')) return `Remote ${file} (Angular element entry)`;
  if (file.includes('mfe-react.js')) return `Remote ${file} (React custom element)`;
  if (file.includes('mfe-vue.js')) return `Remote ${file} (Vue custom element)`;
  if (file.includes('mfe1.js')) return `Remote ${file} (Native Federation ESM)`;
  return `${file} · ${contract}`;
}

function detectFrameworkFromSource(mfe, sourceText = '') {
  const text = String(sourceText || '').toLowerCase();
  
  // Prioriza detecção por ID do MFE primeiro (mais confiável)
  if (mfe.id === 'react') return 'React 18';
  if (mfe.id === 'vue') return 'Vue 3';
  if (mfe.id === 'ng-full') return 'Angular 20 Native Federation';
  if (mfe.id === 'ng') return 'Angular 15 (element)';
  if (mfe.id === 'ssa') return 'Single-SPA (Angular 15)';
  if (mfe.id === 'mf') return 'Webpack Module Federation';
  if (mfe.id === 'nf') return 'Native Federation (ESM)';
  
  // Detecção por conteúdo do source apenas se ID não identificou
  // Usa padrões mais específicos e únicos para cada framework
  if (text.includes('@angular/core') || text.includes('angular.io') || text.includes('platformbrowser')) return 'Angular (detectado)';
  if (text.includes('vue.js.org') || text.includes('createapp') || text.includes('vuejs')) return 'Vue 3 (detectado)';
  if (text.includes('react-dom/client') || text.includes('createroot') || text.includes('_jsx')) return 'React 18 (detectado)';
  if (text.includes('single-spa')) return 'Single-SPA (detectado)';
  
  return 'ESM Module';
}

function extractSharedPackageFromUrl(url) {
  if (!url) return '';
  try {
    if (url.includes('esm.sh/')) {
      const part = url.split('esm.sh/')[1] || '';
      return part.split('?')[0].split('@')[0];
    }
    if (url.includes('cdn.jsdelivr.net/npm/')) {
      const part = url.split('cdn.jsdelivr.net/npm/')[1] || '';
      return part.split('?')[0].split('@')[0];
    }
    if (url.includes('unpkg.com/')) {
      const part = url.split('unpkg.com/')[1] || '';
      return part.split('?')[0].split('@')[0];
    }
  } catch {
    return '';
  }
  return '';
}

function detectEmbeddedLibs(sourceText = '') {
  const text = String(sourceText || '').toLowerCase();
  const markers = [
    ['lodash', 'lodash'],
    ['moment', 'moment'],
    ['dayjs', 'dayjs'],
    ['date-fns', 'date-fns'],
    ['ramda', 'ramda'],
    ['mathjs', 'mathjs'],
    ['three', 'three'],
    ['chart.js', 'chart.js'],
    ['echarts', 'echarts'],
    ['xlsx', 'xlsx'],
    ['react', 'react'],
    ['vue', 'vue'],
    ['angular', '@angular'],
  ];
  return markers.filter(([needle]) => text.includes(needle)).map(([, label]) => label);
}

function extractHttpUrls(text) {
  if (typeof text !== 'string' || !text.trim()) return [];
  const matches = text.match(/https?:\/\/[^"'`\s)]+/g) || [];
  
  // Filtra apenas URLs de assets reais (localhost, CDNs conhecidos)
  // Ignora namespaces XML, schemas, documentação embeddada
  const validUrls = matches.filter(url => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      
      // Apenas localhost e CDNs conhecidos
      if (host === 'localhost' || host.includes('localhost')) return true;
      if (host.includes('esm.sh')) return true;
      if (host.includes('cdn.jsdelivr.net')) return true;
      if (host.includes('unpkg.com')) return true;
      
      // Ignora schemas XML, namespaces, documentação
      if (host.includes('schemas.')) return false;
      if (host.includes('w3.org')) return false;
      if (host.includes('openoffice.org')) return false;
      if (host.includes('oasis-open.org')) return false;
      if (host.includes('microsoft.com')) return false;
      if (host.includes('schemas.')) return false;
      if (host.includes('purl.org')) return false;
      if (host.includes('purl.oclc.org')) return false;
      
      return false; // Por segurança, rejeita outros
    } catch {
      return false;
    }
  });
  
  return [...new Set(validUrls)];
}

async function probeUrlSize(url) {
  if (!url) return 0;
  if (urlSizeCache.has(url)) return urlSizeCache.get(url);

  let size = 0;
  try {
    // Tenta HEAD primeiro (mais rápido)
    try {
      const headRes = await fetch(url, { method: 'HEAD' });
      const cl = headRes.headers.get('content-length');
      if (cl) {
        size = parseInt(cl, 10) || 0;
        if (size > 0) {
          urlSizeCache.set(url, size);
          return size;
        }
      }
    } catch {
      // HEAD pode falhar, continua com GET
    }

    // Sempre faz GET se HEAD não retornou tamanho
    const getRes = await fetch(url);
    if (getRes.ok) {
      // Tenta content-length primeiro
      const cl2 = getRes.headers.get('content-length');
      if (cl2) {
        size = parseInt(cl2, 10) || 0;
      }
      
      // Se não tem content-length, sempre calcula via blob
      if (!size) {
        const blob = await getRes.blob();
        size = blob.size || 0;
      }
    }
  } catch (err) {
    console.warn(`[probeUrlSize] Erro ao medir ${url}:`, err.message);
    size = 0;
  }

  urlSizeCache.set(url, size);
  return size;
}

async function estimateRemoteBundleFootprint(mfe, remoteUrl) {
  const cacheKey = `${mfe.id}::${remoteUrl}`;
  if (bundleSizeCache.has(cacheKey)) return bundleSizeCache.get(cacheKey);

  let entrySize = await probeUrlSize(remoteUrl);
  let sourceText = '';
  try {
    const sourceRes = await fetch(remoteUrl);
    if (sourceRes.ok) {
      sourceText = await sourceRes.text();
      if (!entrySize) {
        entrySize = new Blob([sourceText]).size;
      }
    }
  } catch {
    // noop
  }

  const referenced = new Set(extractHttpUrls(sourceText));
  referenced.delete(remoteUrl);

  // Angular 20 Native Federation: main.js e polyfills.js já são detectados no sourceText
  // Não precisa adicionar manualmente pois estão na mesma pasta que o entry
  if (mfe.id === 'ng-full') {
    try {
      const base = new URL(remoteUrl).origin;
      // Apenas adiciona arquivos que realmente existem no mesmo nível
      [
        `${base}/main.js`,
        `${base}/polyfills.js`,
        `${base}/styles.css`,
      ].forEach((u) => referenced.add(u));
    } catch {
      // noop
    }
  }

  const refs = [];
  let refsSize = 0;
  for (const ref of referenced) {
    const size = await probeUrlSize(ref);
    refs.push({ url: ref, size });
    refsSize += size;
  }

  const externalRefs = refs
    .map((r) => r.url)
    .filter((u) => /^https?:\/\//.test(u) && !u.includes('localhost'));
  const localRefs = refs.map((r) => r.url).filter((u) => u.includes('localhost'));
  const sharedPackages = [...new Set(externalRefs.map(extractSharedPackageFromUrl).filter(Boolean))];

  const total = entrySize + refsSize;
  window.__bundleDebug[mfe.id] = {
    remoteUrl,
    entrySize,
    refs,
    externalRefs,
    localRefs,
    sharedPackages,
    total,
    measuredAt: new Date().toISOString(),
  };

  bundleSizeCache.set(cacheKey, total);
  return total;
}

async function inspectRemoteRuntime(mfe, remoteUrl, mod) {
  const key = `${mfe.id}::${remoteUrl}`;
  if (runtimeInsightsCache.has(key)) return runtimeInsightsCache.get(key);

  let sourceText = '';
  try {
    const res = await fetch(remoteUrl);
    if (res.ok) {
      sourceText = await res.text();
    }
  } catch {
    // noop
  }

  const framework = detectFrameworkFromSource(mfe, sourceText);
  const exportContract = detectExportContract(mod);
  const debug = window.__bundleDebug[mfe.id] || {};
  const embeddedLibs = detectEmbeddedLibs(sourceText);
  const remoteEntryInfo = classifyRemoteEntry(remoteUrl, mod, debug);

  let sharedRuntime = 'Self-contained entry';
  let sharedDetails = [];
  if (Array.isArray(debug.sharedPackages) && debug.sharedPackages.length) {
    sharedDetails = [...debug.sharedPackages];
    const top = sharedDetails.slice(0, 3).join(', ');
    const more = sharedDetails.length > 3 ? ` +${sharedDetails.length - 3}` : '';
    sharedRuntime = `CDN shared: ${top}${more}`;
  } else if (Array.isArray(debug.localRefs) && debug.localRefs.length) {
    const files = [...new Set(debug.localRefs.map((u) => {
      try {
        return new URL(u).pathname.split('/').pop() || u;
      } catch {
        return u;
      }
    }))];
    sharedDetails = files;
    const top = sharedDetails.slice(0, 3).join(', ');
    const more = sharedDetails.length > 3 ? ` +${sharedDetails.length - 3}` : '';
    sharedRuntime = `Runtime chunks: ${top}${more}`;
  } else if (embeddedLibs.length) {
    const uniq = [...new Set(embeddedLibs)];
    sharedDetails = uniq;
    const top = sharedDetails.slice(0, 4).join(', ');
    const more = sharedDetails.length > 4 ? ` +${sharedDetails.length - 4}` : '';
    sharedRuntime = `Embedded: ${top}${more}`;
  }

  const insight = { framework, exportContract, remoteEntryInfo, sharedRuntime, sharedDetails };
  runtimeInsightsCache.set(key, insight);
  return insight;
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

function updateTelemetry(id, duration, bundleSize = 0, insight = null) {
  const current = telemetry.get(id) || {
    count: 0,
    total: 0,
    last: 0,
    best: Infinity,
    worst: 0,
    bundle: bundleSize,
    framework: '--',
    exportContract: '--',
    remoteEntryInfo: '--',
    sharedRuntime: '--',
    sharedDetails: [],
  };
  current.count += 1;
  current.total += duration;
  current.last = duration;
  current.best = Math.min(current.best, duration);
  current.worst = Math.max(current.worst, duration);
  if (bundleSize > 0) current.bundle = bundleSize;
  if (insight?.framework) current.framework = insight.framework;
  if (insight?.exportContract) current.exportContract = insight.exportContract;
  if (insight?.remoteEntryInfo) current.remoteEntryInfo = insight.remoteEntryInfo;
  if (insight?.sharedRuntime) current.sharedRuntime = insight.sharedRuntime;
  if (Array.isArray(insight?.sharedDetails)) current.sharedDetails = insight.sharedDetails;
  telemetry.set(id, current);
  renderTelemetry();
}

function formatKb(bytes) {
  return bytes > 0 ? `${(bytes / 1024).toFixed(1)} KB` : '--';
}

function renderTelemetry() {
  if (!els.telemetryBody) return;

  // State for sorting
  if (!renderTelemetry.sortState) {
    renderTelemetry.sortState = { column: 'score', ascending: true };
  }
  const sortState = renderTelemetry.sortState;

  const allEntries = registry.map((mfe) => {
    const entry = telemetry.get(mfe.id);
    const avg = entry?.count ? entry.total / entry.count : 0;
    return { mfe, entry, avg };
  });

  // Sort by current sortState
  allEntries.sort((a, b) => {
    let valA, valB;
    switch (sortState.column) {
      case 'mfe':
        valA = a.mfe.label.toLowerCase();
        valB = b.mfe.label.toLowerCase();
        break;
      case 'framework':
        valA = (a.entry?.framework || '').toLowerCase();
        valB = (b.entry?.framework || '').toLowerCase();
        break;
      case 'remoteEntry':
        valA = (a.entry?.remoteEntryInfo || '').toLowerCase();
        valB = (b.entry?.remoteEntryInfo || '').toLowerCase();
        break;
      case 'sharedRuntime':
        valA = (a.entry?.sharedRuntime || '').toLowerCase();
        valB = (b.entry?.sharedRuntime || '').toLowerCase();
        break;
      case 'avg':
        valA = a.avg;
        valB = b.avg;
        break;
      case 'best':
        valA = a.entry?.best || 0;
        valB = b.entry?.best || 0;
        break;
      case 'worst':
        valA = a.entry?.worst || 0;
        valB = b.entry?.worst || 0;
        break;
      case 'count':
        valA = a.entry?.count || 0;
        valB = b.entry?.count || 0;
        break;
      case 'bundle':
        valA = a.entry?.bundle || 0;
        valB = b.entry?.bundle || 0;
        break;
      case 'score':
      default:
        valA = a.avg;
        valB = b.avg;
        break;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortState.ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortState.ascending ? valA - valB : valB - valA;
  });

  const globalAvg = allEntries.reduce((sum, e) => sum + (e.avg || 0), 0) / allEntries.length || 0;
  const globalBest = Math.min(...allEntries.map(e => e.entry?.best || Infinity).filter(v => v !== Infinity));
  const globalWorst = Math.max(...allEntries.map(e => e.entry?.worst || 0));
  const totalBundle = allEntries.reduce((sum, e) => sum + (e.entry?.bundle || 0), 0);
  const totalMounts = allEntries.reduce((sum, e) => sum + (e.entry?.count || 0), 0);

  els.telemetryBody.innerHTML = allEntries
    .map(({mfe, entry, avg}) => {
      const klass = avg > 1200 ? 'warn' : avg > 800 ? 'caution' : 'ok';
      return `
        <tr>
          <td><strong>${mfe.label}</strong></td>
          <td class="meta">${escapeHtml(entry?.framework || detectFrameworkFromSource(mfe, ''))}</td>
          <td class="meta" title="${escapeHtml(entry?.exportContract || '--')}">${escapeHtml(entry?.remoteEntryInfo || classifyRemoteEntry(getRemoteUrl(mfe.id), {}, {}))}</td>
          <td class="meta">
            <details>
              <summary>${escapeHtml(entry?.sharedRuntime || 'Aguardando montagem')}</summary>
              <ul class="shared-details-list">
                ${Array.isArray(entry?.sharedDetails) && entry.sharedDetails.length
                  ? entry.sharedDetails.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
                  : '<li>Monte o MFE para listar shared/runtime real</li>'}
              </ul>
            </details>
          </td>
          <td class="${klass}">${formatMs(avg)}</td>
          <td>${formatMs(entry?.best || 0)}</td>
          <td>${formatMs(entry?.worst || 0)}</td>
          <td>${entry?.count || 0}</td>
          <td>${formatKb(entry?.bundle || 0)}</td>
          <td>${formatMs(avg)}</td>
        </tr>
      `;
    })
    .join('') + `
      <tr class="telemetry-summary">
        <td><strong>Resumo</strong></td>
        <td>--</td>
        <td>--</td>
        <td>--</td>
        <td class="${globalAvg > 1200 ? 'warn' : globalAvg > 800 ? 'caution' : 'ok'}">${formatMs(globalAvg)}</td>
        <td>${formatMs(globalBest === Infinity ? 0 : globalBest)}</td>
        <td>${formatMs(globalWorst)}</td>
        <td>${totalMounts}</td>
        <td>${formatKb(totalBundle)}</td>
        <td>--</td>
      </tr>
    `;
}

function wireEvents() {
  els.telemetryBody?.parentElement.querySelectorAll('th').forEach((th, index) => {
    th.style.cursor = 'pointer';
    th.addEventListener('click', () => {
      if (!renderTelemetry.sortState) {
        renderTelemetry.sortState = { column: 'score', ascending: true };
      }
      const current = renderTelemetry.sortState;
      const columns = ['mfe', 'framework', 'remoteEntry', 'sharedRuntime', 'avg', 'best', 'worst', 'count', 'bundle', 'score'];
      const col = columns[index] || 'score';
      if (current.column === col) {
        current.ascending = !current.ascending;
      } else {
        current.column = col;
        current.ascending = true;
      }
      renderTelemetry();
    });
  });

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
          <li>Previews sob demanda (clique em "Carregar previews").</li>
          <li>Timeout e fallback por remote.</li>
          <li>Modal e BUS preservados.</li>
        </ul>
      `,
    );
  });

  els.btnOpenBus?.addEventListener('click', () => {
    openModal('Eventos BUS', toBusHtml());
  });

  els.btnRefreshAll?.addEventListener('click', () => {
    void refreshAll();
  });

  els.btnClearCache?.addEventListener('click', () => {
    clearRuntimeCaches();
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

  els.btnLoadStageAll = document.getElementById('btn-load-stage-all');
  els.btnLoadStageAll?.addEventListener('click', () => {
    void loadAllInStage();
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

function normalizeLifecycle(mod, candidate, props) {
  if (typeof candidate === 'function') return { destroy: async () => candidate() };
  if (candidate && typeof candidate.destroy === 'function') return { destroy: async () => candidate.destroy() };
  if (candidate && typeof candidate.teardown === 'function') return { destroy: async () => candidate.teardown() };
  if (typeof mod.unmount === 'function') return { destroy: async () => mod.unmount(props) };
  return { destroy: async () => { if (props?.outlet) props.outlet.innerHTML = ''; } };
}

async function mountRemote(mfe, outlet) {
  const url = getRemoteUrl(mfe.id);
  const bundleSizePromise = estimateRemoteBundleFootprint(mfe, url).catch(() => 0);
  const started = performance.now();

  const mod = await withTimeout(import(url), IMPORT_TIMEOUT_MS, `import ${mfe.id}`);
  const insightPromise = inspectRemoteRuntime(mfe, url, mod).catch(() => null);
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
  const bundleSize = await bundleSizePromise;
  const insight = await insightPromise;
  console.log(`[shell] bundle ${mfe.id}: ${bundleSize} bytes (footprint estimado)`);
  updateTelemetry(mfe.id, duration, bundleSize, insight);
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

async function refreshAll() {
  if (els.stageStatus) {
    els.stageStatus.textContent = 'Limpando cache e atualizando todos os MFEs...';
  }

  // LIMPA TODO O CACHE PRIMEIRO para forçar nova medição
  bundleSizeCache.clear();
  urlSizeCache.clear();
  runtimeInsightsCache.clear();
  window.__bundleDebug = {};
  telemetry.clear();
  renderTelemetry();

  const previousSelection = new Set(selectedSet);
  registry.forEach((m) => selectedSet.add(m.id));
  renderCards();
  renderSelectedCount();

  if (els.previewGrid) {
    els.previewGrid.innerHTML = '<p class="preview-empty">Atualizando todos os previews...</p>';
  }

  await loadPreviews();

  const first = registry[0];
  if (first) {
    await activateStage(first.id);
  }

  selectedSet.clear();
  previousSelection.forEach((id) => selectedSet.add(id));
  renderCards();
  renderSelectedCount();

  if (els.stageStatus) {
    els.stageStatus.textContent = 'Atualização completa! Cache limpo e todos os MFEs remontados.';
  }
}

function clearRuntimeCaches() {
  bundleSizeCache.clear();
  urlSizeCache.clear();
  runtimeInsightsCache.clear();
  window.__bundleDebug = {};
  telemetry.clear();
  renderTelemetry();
  if (els.stageStatus) {
    els.stageStatus.textContent = 'Cache e telemetria limpos. Monte novamente para recalcular.';
  }
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

async function loadAllInStage() {
  const selected = registry.filter((mfe) => selectedSet.has(mfe.id));
  
  if (!selected.length) {
    if (els.stageStatus) {
      els.stageStatus.textContent = 'Nenhum MFE selecionado. Selecione ao menos 1 MFE.';
    }
    return;
  }

  const COLD_ROUNDS = 5; // 5 medições em cache frio
  const WARM_ROUNDS = 5; // 5 medições em cache quente
  const GC_DELAY = 2000; // Aguarda GC entre cenários
  const MEASURE_DELAY = 500; // Menor delay entre medições
  
  if (els.stageStatus) {
    els.stageStatus.textContent = `🔬 Iniciando benchmark científico: ${COLD_ROUNDS} cold + ${WARM_ROUNDS} warm runs por MFE...`;
  }

  // Limpa tudo antes de começar
  bundleSizeCache.clear();
  urlSizeCache.clear();
  runtimeInsightsCache.clear();
  window.__bundleDebug = {};
  telemetry.clear();
  renderTelemetry();

  const benchmarkResults = new Map();

  // Para cada MFE, executa benchmark isolado
  for (let i = 0; i < selected.length; i++) {
    const mfe = selected[i];
    const coldRuns = [];
    const warmRuns = [];

    if (els.stageStatus) {
      els.stageStatus.textContent = `🔬 [${i + 1}/${selected.length}] Benchmarking ${mfe.label} - Fase 1: Cache FRIO...`;
    }

    // FASE 1: COLD CACHE - limpa cache antes de CADA execução
    for (let run = 1; run <= COLD_ROUNDS; run++) {
      // Força limpeza de cache entre cada run
      bundleSizeCache.clear();
      urlSizeCache.clear();
      runtimeInsightsCache.clear();
      
      // Tenta forçar GC (apenas sugestão ao browser)
      if (window.gc) window.gc();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      if (els.stageStatus) {
        els.stageStatus.textContent = `🔬 ${mfe.label} - Cold run ${run}/${COLD_ROUNDS}`;
      }

      try {
        performance.mark(`${mfe.id}-cold-${run}-start`);
        await activateStage(mfe.id);
        performance.mark(`${mfe.id}-cold-${run}-end`);
        performance.measure(
          `${mfe.id}-cold-${run}`,
          `${mfe.id}-cold-${run}-start`,
          `${mfe.id}-cold-${run}-end`
        );
        
        const measure = performance.getEntriesByName(`${mfe.id}-cold-${run}`)[0];
        coldRuns.push(measure.duration);
        
        await new Promise(resolve => setTimeout(resolve, MEASURE_DELAY));
      } catch (error) {
        console.error(`[benchmark] Falha em ${mfe.label} cold run ${run}`, error);
        coldRuns.push(Infinity);
      }
    }

    // Aguarda GC entre fases
    if (els.stageStatus) {
      els.stageStatus.textContent = `${mfe.label} - Aguardando GC...`;
    }
    await new Promise(resolve => setTimeout(resolve, GC_DELAY));

    if (els.stageStatus) {
      els.stageStatus.textContent = `🔬 [${i + 1}/${selected.length}] ${mfe.label} - Fase 2: Cache QUENTE...`;
    }

    // FASE 2: WARM CACHE - mantém cache entre execuções
    for (let run = 1; run <= WARM_ROUNDS; run++) {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (els.stageStatus) {
        els.stageStatus.textContent = `🔬 ${mfe.label} - Warm run ${run}/${WARM_ROUNDS}`;
      }

      try {
        performance.mark(`${mfe.id}-warm-${run}-start`);
        await activateStage(mfe.id);
        performance.mark(`${mfe.id}-warm-${run}-end`);
        performance.measure(
          `${mfe.id}-warm-${run}`,
          `${mfe.id}-warm-${run}-start`,
          `${mfe.id}-warm-${run}-end`
        );
        
        const measure = performance.getEntriesByName(`${mfe.id}-warm-${run}`)[0];
        warmRuns.push(measure.duration);
        
        await new Promise(resolve => setTimeout(resolve, MEASURE_DELAY));
      } catch (error) {
        console.error(`[benchmark] Falha em ${mfe.label} warm run ${run}`, error);
        warmRuns.push(Infinity);
      }
    }

    // Calcula estatísticas
    const stats = calculateStats(coldRuns, warmRuns);
    benchmarkResults.set(mfe.id, stats);

    console.log(`[benchmark] ${mfe.label}:`, stats);
  }

  // Limpa performance marks
  performance.clearMarks();
  performance.clearMeasures();

  if (els.stageStatus) {
    els.stageStatus.textContent = `✅ Benchmark completo! ${selected.length} MFEs testados (${COLD_ROUNDS} cold + ${WARM_ROUNDS} warm cada). Resultados na telemetria ⬆️`;
  }

  els.telemetryBody?.parentElement?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function calculateStats(coldRuns, warmRuns) {
  const validCold = coldRuns.filter(v => Number.isFinite(v) && v > 0);
  const validWarm = warmRuns.filter(v => Number.isFinite(v) && v > 0);
  
  const coldMedian = median(validCold);
  const warmMedian = median(validWarm);
  const coldAvg = avg(validCold);
  const warmAvg = avg(validWarm);
  const coldStd = stdDev(validCold);
  const warmStd = stdDev(validWarm);
  
  return {
    cold: { median: coldMedian, avg: coldAvg, std: coldStd, runs: validCold.length },
    warm: { median: warmMedian, avg: warmAvg, std: warmStd, runs: validWarm.length },
    overall: {
      // Usa mediana warm como métrica principal (mais estável)
      score: warmMedian,
      // Penaliza alta variância
      stability: warmStd < 50 ? 'excelente' : warmStd < 150 ? 'boa' : 'variável'
    }
  };
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = avg(arr);
  const squareDiffs = arr.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(avg(squareDiffs));
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
