const outlet = document.getElementById('host-outlet');
const loadBtn = document.getElementById('load-remote');
let teardown = null;

async function loadRemote() {
  loadBtn.disabled = true;

  try {
    await teardown?.();
    teardown = null;

    const mod = await import('http://localhost:9101/remote-a.js');
    const result = await mod.render(outlet, {
      host: 'module-federation-shell',
      name: 'remote-a',
      replace: true,
    });

    teardown = normalizeTeardown(mod, result, () => ({
      host: 'module-federation-shell',
      name: 'remote-a',
      outlet,
    }));
  } catch (err) {
    console.error('Falha ao carregar Remote-A', err);
  } finally {
    loadBtn.disabled = false;
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

loadBtn.addEventListener('click', () => void loadRemote());

window.addEventListener('BUS', (event) => {
  console.log('Host MF recebeu BUS', event.detail);
});
