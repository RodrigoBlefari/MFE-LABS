const primaryOutlet = document.getElementById('primary-outlet');
const dashboard = document.getElementById('dashboard');
const dashboardGrid = document.getElementById('dashboard-grid');
const dashboardError = document.getElementById('dashboard-error');
const primaryControls = document.getElementById('primary-controls');
const multiToggle = document.getElementById('multi-toggle');
const btnPanel = document.getElementById('btn-panel');
const btnSelectAll = document.getElementById('btn-select-all');
const btnSelectNone = document.getElementById('btn-select-none');
const insightFastest = document.getElementById('insight-fastest');
const insightSlowest = document.getElementById('insight-slowest');
const insightAverage = document.getElementById('insight-average');
const insightSamples = document.getElementById('insight-samples');

const primaryButtons = new Map();
const chipButtons = new Map();
const interactiveElements = new Set();
const metricsStore = new Map();

function createMetricsSeed() {
  return {
    count: 0,
    total: 0,
    last: 0,
    average: 0,
    best: Number.POSITIVE_INFINITY,
    worst: 0,
  };
}

function getMetricsSnapshot(id) {
  const entry = metricsStore.get(id);
  if (!entry) {
    return {
      count: 0,
      total: 0,
      last: 0,
      average: 0,
      best: 0,
      worst: 0,
    };
  }
  return {
    count: entry.count,
    total: entry.total,
    last: entry.last,
    average: entry.average,
    best: entry.best === Number.POSITIVE_INFINITY ? 0 : entry.best,
    worst: entry.worst,
  };
}

function recordMetrics(id, duration) {
  const entry = metricsStore.get(id) ?? createMetricsSeed();
  const previousCount = entry.count;
  entry.count = previousCount + 1;
  entry.total += duration;
  entry.last = duration;
  entry.best = previousCount === 0 ? duration : Math.min(entry.best, duration);
  entry.worst = previousCount === 0 ? duration : Math.max(entry.worst, duration);
  entry.average = entry.total / entry.count;
  metricsStore.set(id, entry);
  return {
    count: entry.count,
    total: entry.total,
    last: entry.last,
    average: entry.average,
    best: entry.best,
    worst: entry.worst,
  };
}

function toMetricLabel(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '--';
  }
  return `${value.toFixed(1)} ms`;
}

function applyTelemetryBadges(id, metrics) {
  const btn = primaryButtons.get(id);
  if (btn) {
    if (metrics.count > 0) {
      btn.dataset.metric = toMetricLabel(metrics.average);
      btn.title = `Media: ${toMetricLabel(metrics.average)} | Ultimo: ${toMetricLabel(metrics.last)}`;
    } else {
      btn.removeAttribute('data-metric');
      btn.removeAttribute('title');
    }
  }
  const chip = chipButtons.get(id);
  if (chip) {
    if (metrics.count > 0) {
      chip.title = `Ultimo: ${toMetricLabel(metrics.last)} | Melhor: ${toMetricLabel(metrics.best)}`;
    } else {
      chip.removeAttribute('title');
    }
  }
}

function updateInsights() {
  if (!insightFastest || !insightSlowest || !insightAverage || !insightSamples) {
    return;
  }

  const entries = registry
    .map((mfe) => ({
      id: mfe.id,
      label: mfe.label,
      metrics: metricsStore.get(mfe.id),
    }))
    .filter((entry) => entry.metrics && entry.metrics.count > 0);

  if (entries.length === 0) {
    insightFastest.textContent = '--';
    insightSlowest.textContent = '--';
    insightAverage.textContent = '--';
    insightSamples.textContent = '0';
    return;
  }

  const fastest = entries.reduce((best, current) =>
    current.metrics.average < best.metrics.average ? current : best,
  );
  const slowest = entries.reduce((worst, current) =>
    current.metrics.average > worst.metrics.average ? current : worst,
  );
  const totalSamples = entries.reduce((sum, entry) => sum + entry.metrics.count, 0);
  const totalTime = entries.reduce((sum, entry) => sum + entry.metrics.total, 0);
  const globalAverage = totalTime / totalSamples;

  insightFastest.textContent = `${fastest.label} · ${toMetricLabel(fastest.metrics.average)}`;
  insightSlowest.textContent = `${slowest.label} · ${toMetricLabel(slowest.metrics.average)}`;
  insightAverage.textContent = toMetricLabel(globalAverage);
  insightSamples.textContent = String(totalSamples);
}

const registry = [
  {
    id: 'nf',
    label: 'NF - Event Stream',
    accent: '#10b981',
    accentAlt: '#34d399',
    description: 'Remote ESM nativo orientado a eventos com pipeline zero-bundler.',
    tagline: 'CustomEvent + contratos simples: integra Single-SPA e Module Federation sem acoplamento.',
    remote: 'http://localhost:9201/mfe1.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('nf') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9201/mfe1.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'mfe1-nf',
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Native Federation (NF)' : 'Native Federation - Event Stream',
        description: compact
          ? 'MFE ESM nativo emitindo eventos unificados.'
          : 'MFE ESM direto, ideal para times que desejam aderir a federacao sem empacotadores pesados.',
        tagline: compact
          ? 'CustomEvent API sem acoplamento.'
          : 'Emitido via CustomEvent - integracao agnostica com Module/Single-SPA.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'mfe1-nf',
        outlet,
      }));
    },
  },
  {
    id: 'mf',
    label: 'Remote-A - Module Federation',
    accent: '#1c78c0',
    accentAlt: '#8ed6fb',
    description: 'Remote webpack 5 exposto como ESM para catalogos omnichannel regulados.',
    tagline: 'Bridge MF + Native Federation com compartilhamento controlado de dependências.',
    remote: 'http://localhost:9101/remote-a.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('mf') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9101/remote-a.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'remote-a-mf',
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Remote-A (MF)' : 'Remote-A - Module Federation',
        description: compact
          ? 'Remote Federation integrado ao catalogo corporativo.'
          : 'Remote webpack exposto como ESM, pensado para catalogos financeiros e dashboards omnichannel.',
        tagline: compact
          ? 'webpack module federation remoto.'
          : 'Bridge MF + Native Federation - carregado sob demanda com isolamento leve.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'remote-a-mf',
        outlet,
      }));
    },
  },
  {
    id: 'ssa',
    label: 'MFE-A - Single-SPA',
    accent: '#f97316',
    accentAlt: '#fb923c',
    description: 'Lifecycle bootstrap/mount/unmount pronto para modernizar shells legados.',
    tagline: 'Adapter ESM que publica BUS e convive com MF/NF sem retrabalho.',
    remote: 'http://localhost:9001/mfe-a.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ssa') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9001/mfe-a.js');
      const baseProps = {
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet,
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'Single-SPA Widget' : 'Single-SPA - Orchestration Tile',
        description: compact
          ? 'Widget Single-SPA pronto para shells legados.'
          : 'Widget Single-SPA embalado como modulo ESM, ideal para shells legados evoluirem gradualmente.',
        tagline: compact
          ? 'Contrato mount/unmount padrao Single-SPA.'
          : 'Expose mount/unmount e deixe o shell decidir quem convive em tela.',
      };
      if (typeof mod.bootstrap === 'function') {
        await mod.bootstrap(baseProps);
      }
      const mountResult = typeof mod.mount === 'function' ? await mod.mount(baseProps) : null;
      return createLifecycle(mod, mountResult, () => baseProps);
    },
  },
  {
    id: 'ng',
    label: 'Angular - Web Component',
    accent: '#dd0031',
    accentAlt: '#f87171',
    description: 'Angular standalone + Signals empacotado como Custom Element leve.',
    tagline: 'createApplication + @angular/elements com telemetria nativa.',
    remote: 'http://localhost:9301/mfe-ng.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ng') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9301/mfe-ng.js');
      const result = await mod.render(outlet, {
        replace: true,
        variant,
        metrics,
        title: compact ? 'Angular Widget' : 'Angular Engagement Dashboard',
        description: compact
          ? 'Angular standalone registrado via createCustomElement.'
          : 'Web Component Angular standalone com Signals, ideal para orquestracao corporativa.',
        tagline: compact
          ? 'Signals + emissao de BUS.'
          : 'Empacotado com createApplication + @angular/elements.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'angular-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'ng-full',
    label: 'Angular - Experience Platform',
    accent: '#dd0031',
    accentAlt: '#fca5a5',
    description: 'Aplicacao Angular CLI completa disponibilizada como Web Component federado.',
    tagline: 'CLI standalone + Angular Elements pronta para canais regulados.',
    remote: 'http://localhost:9400/mfe-ng-full.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('ng-full') } = {}) => {
      const mod = await import('http://localhost:9400/mfe-ng-full.js');
      const result = await mod.render(outlet, {
        baseUrl: 'http://localhost:9400/',
        variant: compact ? 'compact' : 'full',
        metrics,
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'angular-full-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'react',
    label: 'React - Observability',
    accent: '#61dafb',
    accentAlt: '#38bdf8',
    description: 'React 18 encapsulado como Custom Element para painéis de observabilidade.',
    tagline: 'createRoot + Web Component com isolamento e telemetria de renderizacao.',
    remote: 'http://localhost:9302/mfe-react.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('react') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9302/mfe-react.js');
      const result = await mod.render(outlet, {
        replace: true,
        log: !compact,
        variant,
        metrics,
        title: compact ? 'React Widget' : 'React Observability Widget',
        description: compact
          ? 'ReactDOM.createRoot encapsulado em Custom Element.'
          : 'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
        tagline: compact
          ? 'Stateful e compatvel com orquestracao Native.'
          : 'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
        color: '#0ea5e9',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'react-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'vue',
    label: 'Vue - Operational Insights',
    accent: '#42b883',
    accentAlt: '#22c55e',
    description: 'Vue 3 defineCustomElement otimizado para portais híbridos.',
    tagline: 'Composition API + Custom Element com BUS integrado e métricas reais.',
    remote: 'http://localhost:9303/mfe-vue.js',
    mount: async (outlet, { compact = false, metrics = getMetricsSnapshot('vue') } = {}) => {
      const variant = compact ? 'compact' : 'full';
      const mod = await import('http://localhost:9303/mfe-vue.js');
      const result = await mod.render(outlet, {
        replace: true,
        variant,
        metrics,
        title: compact ? 'Vue Widget' : 'Vue Operational Insights',
        description: compact
          ? 'Vue Custom Element com Composition API.'
          : 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
        tagline: compact
          ? 'defineCustomElement + emissao de BUS.'
          : 'defineCustomElement + Composition API para maxima flexibilidade.',
      });
      return createLifecycle(mod, result, () => ({
        host: 'native-shell',
        name: 'vue-webcomponent',
        outlet,
      }));
    },
  },
];

const registryMap = new Map(registry.map((m) => [m.id, m]));

let primaryKey = registry[0].id;
let primaryLifecycle = null;
const combinedLifecycles = new Map();
const selectedSet = new Set(registry.map((m) => m.id));

function registerInteractive(el) {
  interactiveElements.add(el);
}

function setLoading(isLoading) {
  interactiveElements.forEach((el) => {
    el.disabled = isLoading;
    if (isLoading) {
      el.classList.add('is-loading');
    } else {
      el.classList.remove('is-loading');
    }
  });
}

function createLifecycle(mod, candidate, getProps) {
  const updateMetrics =
    candidate && typeof candidate.updateMetrics === 'function'
      ? (metrics) => {
          try {
            candidate.updateMetrics(metrics);
          } catch (err) {
            console.error('Falha ao atualizar metricas do MFE', err);
          }
        }
      : () => {};

  const fallback = async () => {
    const props = getProps?.();
    if (props?.outlet instanceof Element) {
      props.outlet.innerHTML = '';
    }
  };

  if (typeof candidate === 'function') {
    return { teardown: async () => candidate(), updateMetrics };
  }

  if (candidate && typeof candidate.destroy === 'function') {
    return { teardown: async () => candidate.destroy(), updateMetrics };
  }

  if (candidate && typeof candidate.teardown === 'function') {
    return { teardown: async () => candidate.teardown(), updateMetrics };
  }

  if (mod && typeof mod.unmount === 'function') {
    return { teardown: async () => mod.unmount(getProps?.()), updateMetrics };
  }

  return { teardown: fallback, updateMetrics };
}

async function teardownPrimary() {
  if (primaryLifecycle?.teardown) {
    try {
      await primaryLifecycle.teardown();
    } catch (err) {
      console.error('Falha ao desmontar primario', err);
    }
    primaryLifecycle = null;
  }
  primaryOutlet.innerHTML = '';
}

async function clearCombined() {
  const tasks = Array.from(combinedLifecycles.values()).map((lifecycle) =>
    Promise.resolve()
      .then(() => lifecycle?.teardown && lifecycle.teardown())
      .catch((err) => console.error('Falha ao desmontar combinado', err)),
  );
  combinedLifecycles.clear();
  await Promise.all(tasks);
  dashboardGrid.innerHTML = '';
  dashboardError.textContent = '';
  dashboard.removeAttribute('data-error');
}

function updatePrimaryButtons() {
  primaryButtons.forEach((btn, id) => {
    btn.classList.toggle('active', id === primaryKey);
  });
}

function updateChips() {
  chipButtons.forEach((chip, id) => {
    chip.classList.toggle('selected', selectedSet.has(id));
  });
}

async function mountPrimary(key) {
  const mfe = registryMap.get(key);
  if (!mfe) return;
  primaryKey = key;
  updatePrimaryButtons();
  setLoading(true);
  try {
    await teardownPrimary();
    const start = performance.now();
    const lifecycle =
      (await mfe.mount(primaryOutlet, {
        compact: false,
        metrics: getMetricsSnapshot(mfe.id),
      })) ?? createLifecycle(null, null, null);
    const duration = performance.now() - start;
    primaryLifecycle = lifecycle;
    const metrics = recordMetrics(mfe.id, duration);
    primaryLifecycle.updateMetrics?.(metrics);
    applyTelemetryBadges(mfe.id, metrics);
    updateInsights();
  } catch (err) {
    console.error(`Falha ao carregar ${mfe.label} no painel principal`, err);
    primaryOutlet.innerHTML =
      '<div class="dashboard-error-card">Nao foi possivel carregar este MFE. Consulte o console.</div>';
  } finally {
    setLoading(false);
    updatePrimaryButtons();
  }
}

async function renderCombinedPanel() {
  setLoading(true);
  try {
    await clearCombined();
    if (selectedSet.size === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum MFE selecionado. Escolha itens no seletor para preencher o painel.';
      dashboardGrid.appendChild(empty);
      dashboard.classList.remove('dashboard-active');
      return;
    }

    let hasUpdates = false;
    const tasks = Array.from(selectedSet).map(async (id) => {
      const mfe = registryMap.get(id);
      const slot = document.createElement('div');
      slot.className = 'dashboard-slot';
      slot.dataset.mfe = id;
      slot.style.setProperty('--accent', mfe.accent);
      dashboardGrid.appendChild(slot);

      try {
        const start = performance.now();
        const lifecycle =
          (await mfe.mount(slot, {
            compact: true,
            metrics: getMetricsSnapshot(id),
          })) ?? createLifecycle(null, null, null);
        const duration = performance.now() - start;
        combinedLifecycles.set(id, lifecycle);
        const metrics = recordMetrics(id, duration);
        lifecycle.updateMetrics?.(metrics);
        applyTelemetryBadges(id, metrics);
        hasUpdates = true;
      } catch (err) {
        console.error(`Falha ao carregar ${mfe.label} no painel combinado`, err);
        const errorCard = document.createElement('div');
        errorCard.className = 'dashboard-error-card';
        errorCard.innerHTML = `<strong>${mfe.label}</strong><br />Nao foi possivel carregar este MFE agora.`;
        slot.appendChild(errorCard);
      }
    });

    await Promise.all(tasks);
    if (hasUpdates) {
      updateInsights();
    }

    if (combinedLifecycles.size !== selectedSet.size) {
      dashboard.setAttribute('data-error', 'true');
      dashboardError.textContent = 'Alguns MFEs nao responderam. Recarregue ou verifique os servicos.';
    }

    dashboard.classList.add('dashboard-active');
  } finally {
    setLoading(false);
  }
}

function toggleSelection(id) {
  if (selectedSet.has(id)) {
    selectedSet.delete(id);
  } else {
    selectedSet.add(id);
  }
  updateChips();
  void renderCombinedPanel();
}

function buildMenus() {
  registry.forEach((mfe) => {
    const primaryBtn = document.createElement('button');
    primaryBtn.type = 'button';
    primaryBtn.className = 'nav-button';
    primaryBtn.textContent = mfe.label;
    primaryBtn.style.setProperty('--accent', mfe.accent);
    primaryBtn.addEventListener('click', () => void mountPrimary(mfe.id));
    primaryControls.appendChild(primaryBtn);
    primaryButtons.set(mfe.id, primaryBtn);
    registerInteractive(primaryBtn);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'multi-chip';
    chip.textContent = mfe.label;
    chip.style.setProperty('--accent', mfe.accentAlt || mfe.accent);
    chip.addEventListener('click', () => toggleSelection(mfe.id));
    multiToggle.appendChild(chip);
    chipButtons.set(mfe.id, chip);
    registerInteractive(chip);
  });

  [btnPanel, btnSelectAll, btnSelectNone].forEach((btn) => registerInteractive(btn));

  btnPanel.addEventListener('click', () => void renderCombinedPanel());
  btnSelectAll.addEventListener('click', () => {
    registry.forEach((mfe) => selectedSet.add(mfe.id));
    updateChips();
    void renderCombinedPanel();
  });
  btnSelectNone.addEventListener('click', () => {
    selectedSet.clear();
    updateChips();
    void renderCombinedPanel();
  });
}

function init() {
  buildMenus();
  updatePrimaryButtons();
  updateChips();
  updateInsights();
  window.addEventListener('BUS', (event) => {
    console.log('Shell NF recebeu BUS', event.detail);
  });

  void mountPrimary(primaryKey).then(() => renderCombinedPanel());
}

init();
