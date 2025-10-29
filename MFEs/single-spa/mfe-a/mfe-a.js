const instances = new Map();

function ensureStylesheet() {
  if (document.querySelector('link[data-mfe-a-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-a.css', import.meta.url).href;
  link.dataset.mfeAStyle = 'true';
  document.head.appendChild(link);
}

export function createOutlet({ mountPoint = document.body, append = false } = {}) {
  const surface = document.createElement('div');
  surface.classList.add('mfe-surface');
  if (append && mountPoint instanceof Element) {
    mountPoint.appendChild(surface);
  }
  return surface;
}

function resolveHost(props) {
  if (props.outlet instanceof Element) return props.outlet;
  if (props.domElement instanceof Element) return props.domElement;
  if (typeof props.domElementGetter === 'function') {
    const resolved = props.domElementGetter();
    if (resolved instanceof Element) return resolved;
  }
  return null;
}

function cleanup(state) {
  if (!state) return;
  state.pingBtn?.removeEventListener('click', state.onPing);
  window.removeEventListener('BUS', state.onBus);
  if (state.replace) {
    state.host.innerHTML = '';
  } else if (state.card?.isConnected) {
    state.card.remove();
  }
  if (state.detach && state.host?.isConnected) {
    state.host.remove();
  }
}

export async function bootstrap() {
  ensureStylesheet();
}

export async function mount(props = {}) {
  ensureStylesheet();

  const {
    appendTo = document.body,
    replace = true,
    title = 'MFE-A (Single-SPA demo)',
    log = true,
  } = props;

  let host = resolveHost(props);
  const hostProvided = host instanceof Element;
  if (!hostProvided) {
    host = createOutlet({ mountPoint: appendTo, append: true });
  }
  const detach = !hostProvided;
  if (replace) {
    host.innerHTML = '';
  }
  host.classList.add('mfe-surface');

  // Remove previous instance bound to this host.
  if (instances.has(host)) {
    cleanup(instances.get(host));
    instances.delete(host);
  }

  const card = host.ownerDocument.createElement('section');
  card.className = 'mfe-card';

  const heading = host.ownerDocument.createElement('h2');
  heading.textContent = title;

  const toolbar = host.ownerDocument.createElement('div');
  toolbar.className = 'mfe-toolbar';

  const pingBtn = host.ownerDocument.createElement('button');
  pingBtn.type = 'button';
  pingBtn.className = 'mfe-btn';
  pingBtn.textContent = 'Emitir PING';

  toolbar.appendChild(pingBtn);

  const logArea = host.ownerDocument.createElement('div');
  logArea.className = 'mfe-log';
  logArea.setAttribute('aria-live', 'polite');

  card.appendChild(heading);
  card.appendChild(toolbar);
  if (log) {
    card.appendChild(logArea);
  }

  host.appendChild(card);

  const onPing = () => {
    window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'PING' } }));
    if (log && logArea) {
      logArea.textContent = 'BUS emitido pelo MFE-A';
    }
  };

  const onBus = (event) => {
    if (!log || event.type !== 'BUS' || !logArea) return;
    const detail = typeof event.detail === 'object' ? JSON.stringify(event.detail) : String(event.detail);
    logArea.textContent = `BUS recebido: ${detail}`;
  };

  pingBtn.addEventListener('click', onPing);
  window.addEventListener('BUS', onBus);

  const state = {
    host,
    card,
    pingBtn,
    logArea,
    onPing,
    onBus,
    detach,
    replace,
  };

  instances.set(host, state);

  const destroy = () => {
    if (!instances.has(host)) return;
    cleanup(state);
    instances.delete(host);
  };

  destroy.host = host;
  destroy.card = card;

  return destroy;
}

export async function unmount(props = {}) {
  const host = resolveHost(props);
  const target = host instanceof Element
    ? host
    : props && props.outlet instanceof Element
      ? props.outlet
      : null;

  if (target && instances.has(target)) {
    const state = instances.get(target);
    cleanup(state);
    instances.delete(target);
    return;
  }

  for (const state of instances.values()) {
    cleanup(state);
  }
  instances.clear();
}
