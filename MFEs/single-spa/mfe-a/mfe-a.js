let active = null;

function resolveHost(props) {
  if (props.outlet instanceof Element) return props.outlet;
  if (props.domElement instanceof Element) return props.domElement;
  if (typeof props.domElementGetter === 'function') {
    const resolved = props.domElementGetter();
    if (resolved instanceof Element) return resolved;
  }
  return null;
}

function cleanup(state){
  if (!state) return;
  state.pingBtn.onclick = null;
  window.removeEventListener('BUS', state.onBus);
  if (state.detachOnUnmount && state.host.isConnected) {
    state.host.remove();
  } else {
    state.host.innerHTML = '';
  }
  if (active === state) {
    active = null;
  }
}

export async function bootstrap(){
  return Promise.resolve();
}

export async function mount(props = {}){
  await unmount(props);

  let host = resolveHost(props);
  let detachOnUnmount = false;
  if (!host) {
    host = document.createElement('div');
    document.body.appendChild(host);
    detachOnUnmount = true;
  }

  host.innerHTML = `<section style="padding:8px;border:1px solid #ccc;border-radius:8px">
    <h2>MFE-A (Single-SPA demo)</h2>
    <button id="ping">Emitir PING</button>
    <div id="log"></div>
  </section>`;

  const pingBtn = host.querySelector('#ping');
  const log = host.querySelector('#log');

  pingBtn.onclick = () => window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'PING' } }));
  const onBus = (event) => {
    if (event.type === 'BUS' && log) {
      log.textContent = 'Recebido BUS';
    }
  };
  window.addEventListener('BUS', onBus);

  const state = {
    host,
    pingBtn,
    onBus,
    detachOnUnmount,
    context: {
      name: props.name ?? '@org/mfe-a',
      host: props.host ?? 'single-spa-shell',
    }
  };

  active = state;

  return () => cleanup(state);
}

export async function unmount(){
  cleanup(active);
  return Promise.resolve();
}
