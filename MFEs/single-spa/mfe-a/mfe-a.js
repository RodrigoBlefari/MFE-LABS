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
    title = 'Single-SPA - Orchestration Tile',
    description = 'Widget Single-SPA embalado como modulo ESM, ideal para shells legados evoluirem gradualmente.',
    tagline = 'Expose mount/unmount e deixe o host decidir quem convive em tela.',
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

  if (instances.has(host)) {
    cleanup(instances.get(host));
    instances.delete(host);
  }

  const card = host.ownerDocument.createElement('section');
  card.className = 'ssa-card';

  const badge = host.ownerDocument.createElement('span');
  badge.className = 'ssa-badge';
  badge.textContent = 'Single-SPA Remote';

  const heading = host.ownerDocument.createElement('h2');
  heading.textContent = title;

  const descriptionEl = host.ownerDocument.createElement('p');
  descriptionEl.className = 'ssa-description';
  descriptionEl.textContent = description;

  const taglineEl = host.ownerDocument.createElement('p');
  taglineEl.className = 'ssa-tagline';
  taglineEl.textContent = tagline;

  const metrics = host.ownerDocument.createElement('div');
  metrics.className = 'ssa-metrics';
  const metricRows = [
    ['Cluster', 'APAC-CX'],
    ['Deploys semanais', `${(Math.random() * 4 + 4).toFixed(0)}x`],
    ['Eventos emitidos', '0'],
  ];
  let eventsValueEl = null;
  metricRows.forEach(([label, value]) => {
    const row = host.ownerDocument.createElement('span');
    const strong = host.ownerDocument.createElement('strong');
    strong.textContent = label;
    const val = host.ownerDocument.createElement('span');
    val.textContent = value;
    if (label === 'Eventos emitidos') {
      eventsValueEl = val;
    }
    row.append(strong, val);
    metrics.appendChild(row);
  });

  const pingBtn = host.ownerDocument.createElement('button');
  pingBtn.type = 'button';
  pingBtn.className = 'mfe-btn';
  pingBtn.textContent = 'Emitir PING';

  const logArea = host.ownerDocument.createElement('div');
  logArea.className = 'mfe-log';
  logArea.setAttribute('aria-live', 'polite');

  card.append(badge, heading, descriptionEl, taglineEl, metrics, pingBtn);
  if (log) {
    card.appendChild(logArea);
  }

  host.appendChild(card);

  const onPing = () => {
    const next = Number(eventsValueEl?.textContent || '0') + 1;
    if (eventsValueEl) {
      eventsValueEl.textContent = String(next);
    }
    window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'PING', count: next } }));
    if (log && logArea) {
      logArea.textContent = `BUS emitido pelo MFE-A - total ${next}`;
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

  return () => {
    cleanup(state);
    instances.delete(host);
  };
}

export async function unmount(props = {}) {
  const host = resolveHost(props);
  const target =
    host instanceof Element
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
