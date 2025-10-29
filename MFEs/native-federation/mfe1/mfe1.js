const instances = new Map();

function ensureStylesheet() {
  if (document.querySelector('link[data-mfe1-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe1.css', import.meta.url).href;
  link.dataset.mfe1Style = 'true';
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

export function render(outlet, options = {}) {
  ensureStylesheet();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('MFE1 render precisa de um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'MFE1 (Native Federation demo ESM)',
    log = true,
    onBus,
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  host.classList.add('mfe-surface');
  if (replace) {
    host.innerHTML = '';
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
  pingBtn.textContent = 'Emitir BUS (NF)';

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
    const detail = { type: 'NF-PING' };
    window.dispatchEvent(new CustomEvent('BUS', { detail }));
    if (typeof onBus === 'function') {
      onBus(detail);
    }
    if (log && logArea) {
      logArea.textContent = 'BUS emitido pelo MFE1';
    }
  };

  const onBusHandler = (event) => {
    if (event.type !== 'BUS') return;
    if (typeof onBus === 'function') {
      onBus(event.detail);
    }
    if (!log || !logArea) return;
    const detail = typeof event.detail === 'object' ? JSON.stringify(event.detail) : String(event.detail);
    logArea.textContent = `BUS recebido: ${detail}`;
  };

  pingBtn.addEventListener('click', onPing);
  window.addEventListener('BUS', onBusHandler);

  const state = {
    host,
    card,
    pingBtn,
    logArea,
    onPing,
    onBus: onBusHandler,
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

export function unmount(ctx = {}) {
  const target = ctx && ctx.host instanceof Element
    ? ctx.host
    : ctx && ctx.outlet instanceof Element
      ? ctx.outlet
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
