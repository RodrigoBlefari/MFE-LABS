const primaryOutlet = document.getElementById('primary-outlet');
const dashboard = document.getElementById('dashboard');
const dashboardGrid = document.getElementById('dashboard-grid');
const dashboardError = document.getElementById('dashboard-error');
const primaryControls = document.getElementById('primary-controls');
const multiToggle = document.getElementById('multi-toggle');
const btnPanel = document.getElementById('btn-panel');
const btnSelectAll = document.getElementById('btn-select-all');
const btnSelectNone = document.getElementById('btn-select-none');

const primaryButtons = new Map();
const chipButtons = new Map();
const interactiveElements = new Set();

const registry = [
  {
    id: 'nf',
    label: 'NF - Event Stream',
    accent: '#10b981',
    accentAlt: '#34d399',
    description: 'MFE ESM puro para times que preferem builds leves com controle total de deploy.',
    tagline: 'Emitido via CustomEvent - sem bundler e sem lock-in.',
    remote: 'http://localhost:9201/mfe1.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9201/mfe1.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'mfe1-nf',
        replace: true,
        log: !compact,
        title: compact ? 'Native Federation (NF)' : 'Native Federation - Event Stream',
        description: compact
          ? 'MFE ESM nativo emitindo eventos unificados.'
          : 'MFE ESM direto, ideal para times que desejam aderir a federacao sem empacotadores pesados.',
        tagline: compact
          ? 'CustomEvent API sem acoplamento.'
          : 'Emitido via CustomEvent - integracao agnostica com Module/Single-SPA.',
      });
      return normalizeTeardown(mod, result, () => ({
        host: 'native-shell',
        name: 'mfe1-nf',
        outlet,
      }));
    },
  },
  {
    id: 'mf',
    label: 'Remote-A - Module Federation',
    accent: '#2563eb',
    accentAlt: '#60a5fa',
    description: 'Remote webpack exposto como ESM para catalogos financeiros e dashboards omnichannel.',
    tagline: 'Bridge MF + Native Federation - carregado sob demanda com isolamento leve.',
    remote: 'http://localhost:9101/remote-a.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9101/remote-a.js');
      const result = await mod.render(outlet, {
        host: 'native-shell',
        name: 'remote-a-mf',
        replace: true,
        log: !compact,
        title: compact ? 'Remote-A (MF)' : 'Remote-A - Module Federation',
        description: compact
          ? 'Remote Federation integrado ao catalogo corporativo.'
          : 'Remote webpack exposto como ESM, pensado para catalogos financeiros e dashboards omnichannel.',
        tagline: compact
          ? 'webpack module federation remoto.'
          : 'Bridge MF + Native Federation - carregado sob demanda com isolamento leve.',
      });
      return normalizeTeardown(mod, result, () => ({
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
    description: 'Widget Single-SPA embalado como modulo ESM para shells que evoluem gradualmente.',
    tagline: 'Expose mount/unmount e deixe o host decidir quem convive em tela.',
    remote: 'http://localhost:9001/mfe-a.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9001/mfe-a.js');
      const baseProps = {
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet,
        replace: true,
        log: !compact,
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
      return normalizeTeardown(mod, mountResult, () => baseProps);
    },
  },
  {
    id: 'ng',
    label: 'Angular - Web Component',
    accent: '#ec4899',
    accentAlt: '#a855f7',
    description: 'Angular standalone com Signals convertido em Web Component.',
    tagline: 'createApplication + Signals - pronto para design systems compartilhados.',
    remote: 'http://localhost:9301/mfe-ng.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9301/mfe-ng.js');
      const result = await mod.render(outlet, {
        replace: true,
        title: compact ? 'Angular Widget' : 'Angular Engagement Dashboard',
        description: compact
          ? 'Angular standalone registrado via createCustomElement.'
          : 'Web Component Angular standalone com Signals, ideal para orquestracao corporativa.',
        tagline: compact
          ? 'Signals + emissao de BUS.'
          : 'Empacotado com createApplication + @angular/elements.',
      });
      return normalizeTeardown(mod, result, () => ({
        host: 'native-shell',
        name: 'angular-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'react',
    label: 'React - Observability',
    accent: '#22d3ee',
    accentAlt: '#0ea5e9',
    description: 'React 18 renderizado via Custom Element com metricas em tempo real.',
    tagline: 'createRoot + Web Component wrapper - estado isolado.',
    remote: 'http://localhost:9302/mfe-react.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9302/mfe-react.js');
      const result = await mod.render(outlet, {
        replace: true,
        log: !compact,
        title: compact ? 'React Widget' : 'React Observability Widget',
        description: compact
          ? 'ReactDOM.createRoot encapsulado em Custom Element.'
          : 'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
        tagline: compact
          ? 'Stateful e compatvel com orquestracao Native.'
          : 'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
        color: '#0ea5e9',
      });
      return normalizeTeardown(mod, result, () => ({
        host: 'native-shell',
        name: 'react-webcomponent',
        outlet,
      }));
    },
  },
  {
    id: 'vue',
    label: 'Vue - Operational Insights',
    accent: '#34d399',
    accentAlt: '#10b981',
    description: 'Vue 3 exportado via defineCustomElement, pronto para portais hibridos.',
    tagline: 'Composition API - integracoes heterogeneas sem atrito.',
    remote: 'http://localhost:9303/mfe-vue.js',
    mount: async (outlet, { compact = false } = {}) => {
      const mod = await import('http://localhost:9303/mfe-vue.js');
      const result = await mod.render(outlet, {
        replace: true,
        title: compact ? 'Vue Widget' : 'Vue Operational Insights',
        description: compact
          ? 'Vue Custom Element com Composition API.'
          : 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
        tagline: compact
          ? 'defineCustomElement + emissao de BUS.'
          : 'defineCustomElement + Composition API para maxima flexibilidade.',
      });
      return normalizeTeardown(mod, result, () => ({
        host: 'native-shell',
        name: 'vue-webcomponent',
        outlet,
      }));
    },
  },
];

const registryMap = new Map(registry.map((m) => [m.id, m]));

let primaryKey = registry[0].id;
let primaryTeardown = null;
const combinedTeardowns = new Map();
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

function normalizeTeardown(mod, candidate, getProps) {
  if (typeof candidate === 'function') {
    return async () => candidate();
  }
  if (candidate && typeof candidate.destroy === 'function') {
    return async () => candidate.destroy();
  }
  if (candidate && typeof candidate.teardown === 'function') {
    return async () => candidate.teardown();
  }
  if (typeof mod.unmount === 'function') {
    return async () => mod.unmount(getProps?.());
  }
  return async () => {
    const props = getProps?.();
    if (props?.outlet) {
      props.outlet.innerHTML = '';
    }
  };
}

async function teardownPrimary() {
  if (typeof primaryTeardown === 'function') {
    try {
      await primaryTeardown();
    } catch (err) {
      console.error('Falha ao desmontar primario', err);
    }
    primaryTeardown = null;
  }
  primaryOutlet.innerHTML = '';
}

async function clearCombined() {
  const tasks = Array.from(combinedTeardowns.values()).map((fn) =>
    Promise.resolve()
      .then(() => fn())
      .catch((err) => console.error('Falha ao desmontar combinado', err)),
  );
  combinedTeardowns.clear();
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
    const teardown = await mfe.mount(primaryOutlet, { compact: false });
    primaryTeardown = teardown;
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

    const tasks = Array.from(selectedSet).map(async (id) => {
      const mfe = registryMap.get(id);
      const slot = document.createElement('div');
      slot.className = 'dashboard-slot';
      slot.dataset.mfe = id;
      slot.style.setProperty('--accent', mfe.accent);
      dashboardGrid.appendChild(slot);

      try {
        const teardown = await mfe.mount(slot, { compact: true });
        combinedTeardowns.set(id, teardown);
      } catch (err) {
        console.error(`Falha ao carregar ${mfe.label} no painel combinado`, err);
        const errorCard = document.createElement('div');
        errorCard.className = 'dashboard-error-card';
        errorCard.innerHTML = `<strong>${mfe.label}</strong><br />Nao foi possivel carregar este MFE agora.`;
        slot.appendChild(errorCard);
      }
    });

    await Promise.all(tasks);

    if (combinedTeardowns.size !== selectedSet.size) {
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
  window.addEventListener('BUS', (event) => {
    console.log('Shell NF recebeu BUS', event.detail);
  });

  void mountPrimary(primaryKey).then(() => renderCombinedPanel());
}

init();
