const buttons = {
  nf: document.getElementById('btn-nf'),
  mf: document.getElementById('btn-mf'),
  ssa: document.getElementById('btn-ssa'),
  all: document.getElementById('btn-all'),
};

const primaryOutlet = document.getElementById('primary-outlet');
const dashboard = document.getElementById('dashboard');
const dashboardError = document.getElementById('dashboard-error');
const dashboardSlots = {
  nf: document.getElementById('dashboard-nf'),
  mf: document.getElementById('dashboard-mf'),
  ssa: document.getElementById('dashboard-ssa'),
};

let primaryTeardown = null;
const dashboardTeardowns = new Map();
let currentPrimaryKey = null;

function setLoading(isLoading) {
  Object.values(buttons).forEach((btn) => {
    btn.disabled = isLoading;
  });
}

async function teardownPrimary() {
  if (typeof primaryTeardown === 'function') {
    await primaryTeardown();
    primaryTeardown = null;
  }
  primaryOutlet.innerHTML = '';
  currentPrimaryKey = null;
}

async function clearDashboard() {
  const tasks = Array.from(dashboardTeardowns.values()).map((fn) => fn());
  dashboardTeardowns.clear();
  await Promise.all(tasks);
  Object.values(dashboardSlots).forEach((slot) => {
    slot.innerHTML = '';
  });
  dashboard.classList.remove('dashboard-active');
  dashboard.removeAttribute('data-error');
  if (dashboardError) {
    dashboardError.textContent = '';
  }
  if (dashboard.dataset) {
    delete dashboard.dataset.primary;
  }
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

async function activatePrimary(key, loader) {
  setLoading(true);
  try {
    await teardownPrimary();
    await clearDashboard();
    primaryTeardown = await loader();
    currentPrimaryKey = key;
  } catch (err) {
    console.error('Falha ao ativar visualizacao individual', err);
    primaryOutlet.textContent = 'Falha ao carregar o MFE (verifique o console).';
    currentPrimaryKey = null;
  } finally {
    setLoading(false);
  }
}

async function activateDashboard() {
  setLoading(true);
  try {
    await clearDashboard();

    const [nfMod, mfMod, ssaMod] = await Promise.all([
      import('http://localhost:9201/mfe1.js'),
      import('http://localhost:9101/remote-a.js'),
      import('http://localhost:9001/mfe-a.js'),
    ]);

    const nfResult = await nfMod.render(dashboardSlots.nf, {
      host: 'native-shell',
      name: 'mfe1-nf',
      replace: true,
      log: false,
    });
    dashboardTeardowns.set(
      'nf',
      normalizeTeardown(nfMod, nfResult, () => ({
        host: 'native-shell',
        name: 'mfe1-nf',
        hostElement: dashboardSlots.nf,
        outlet: dashboardSlots.nf,
      })),
    );

    const mfResult = await mfMod.render(dashboardSlots.mf, {
      host: 'native-shell',
      name: 'remote-a-mf',
      replace: true,
      log: false,
      title: 'Remote-A (MF)',
    });
    dashboardTeardowns.set(
      'mf',
      normalizeTeardown(mfMod, mfResult, () => ({
        host: 'native-shell',
        name: 'remote-a-mf',
        hostElement: dashboardSlots.mf,
        outlet: dashboardSlots.mf,
      })),
    );

    if (typeof ssaMod.bootstrap === 'function') {
      await ssaMod.bootstrap({
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet: dashboardSlots.ssa,
        replace: true,
      });
    }
    const ssaResult = typeof ssaMod.mount === 'function'
      ? await ssaMod.mount({
          name: '@org/mfe-a',
          host: 'native-shell',
          outlet: dashboardSlots.ssa,
          replace: true,
          log: false,
          title: 'MFE-A (Single-SPA)',
        })
      : null;
    dashboardTeardowns.set(
      'ssa',
      normalizeTeardown(ssaMod, ssaResult, () => ({
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet: dashboardSlots.ssa,
      })),
    );

    dashboard.classList.add('dashboard-active');
    if (currentPrimaryKey) {
      dashboard.dataset.primary = currentPrimaryKey;
    } else {
      delete dashboard.dataset.primary;
    }
  } catch (err) {
    console.error('Falha ao montar painel conjunto', err);
    if (dashboardError) {
      dashboardError.textContent = 'Falha ao carregar o painel combinado.';
    }
    dashboard.setAttribute('data-error', 'true');
  } finally {
    setLoading(false);
  }
}

buttons.nf.addEventListener('click', () =>
  activatePrimary('nf', async () => {
    const mod = await import('http://localhost:9201/mfe1.js');
    const result = await mod.render(primaryOutlet, {
      host: 'native-shell',
      name: 'mfe1-nf',
      replace: true,
    });
    return normalizeTeardown(mod, result, () => ({
      host: 'native-shell',
      name: 'mfe1-nf',
      outlet: primaryOutlet,
    }));
  }),
);

buttons.mf.addEventListener('click', () =>
  activatePrimary('mf', async () => {
    const mod = await import('http://localhost:9101/remote-a.js');
    const result = await mod.render(primaryOutlet, {
      host: 'native-shell',
      name: 'remote-a-mf',
      replace: true,
    });
    return normalizeTeardown(mod, result, () => ({
      host: 'native-shell',
      name: 'remote-a-mf',
      outlet: primaryOutlet,
    }));
  }),
);

buttons.ssa.addEventListener('click', () =>
  activatePrimary('ssa', async () => {
    const mod = await import('http://localhost:9001/mfe-a.js');
    if (typeof mod.bootstrap === 'function') {
      await mod.bootstrap({
        name: '@org/mfe-a',
        host: 'native-shell',
        outlet: primaryOutlet,
        replace: true,
      });
    }
    const result = typeof mod.mount === 'function'
      ? await mod.mount({
          name: '@org/mfe-a',
          host: 'native-shell',
          outlet: primaryOutlet,
          replace: true,
        })
      : null;
    return normalizeTeardown(mod, result, () => ({
      name: '@org/mfe-a',
      host: 'native-shell',
      outlet: primaryOutlet,
    }));
  }),
);

buttons.all.addEventListener('click', () => {
  void activateDashboard();
});

window.addEventListener('BUS', (event) => {
  console.log('Shell NF recebeu BUS', event.detail);
});
