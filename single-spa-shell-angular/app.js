const outlet = document.getElementById('outlet');
let activeRoute = null;
let activeTeardown = null;

async function ensureUnmount() {
  if (typeof activeTeardown === 'function') {
    await activeTeardown();
    activeTeardown = null;
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

async function render() {
  const route = location.hash.startsWith('#/a') ? 'mfe-a' : 'home';
  if (route === activeRoute) {
    return;
  }

  await ensureUnmount();

  if (route === 'mfe-a') {
    try {
      const mod = await System.import('@org/mfe-a');
      if (typeof mod.bootstrap === 'function') {
        await mod.bootstrap({
          name: '@org/mfe-a',
          host: 'single-spa-shell',
          outlet,
        });
      }

      const result = typeof mod.mount === 'function'
        ? await mod.mount({
            name: '@org/mfe-a',
            host: 'single-spa-shell',
            outlet,
            replace: true,
          })
        : null;

      activeTeardown = normalizeTeardown(mod, result, () => ({
        name: '@org/mfe-a',
        host: 'single-spa-shell',
        outlet,
      }));
    } catch (err) {
      console.error('Falha ao carregar MFE-A', err);
      outlet.textContent = 'Falha ao carregar MFE-A (consulte o console).';
    }
  } else {
    outlet.innerHTML = '<p>Home do Shell Single-SPA (demo minimalista).</p>';
  }

  activeRoute = route;
}

window.addEventListener('hashchange', () => void render());

render().catch((err) => console.error('Erro ao inicializar shell Single-SPA', err));
