const instances = new Map();

function ensureStylesheet() {
  if (document.querySelector('link[data-remote-a-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./remote-a.css', import.meta.url).href;
  link.dataset.remoteAStyle = 'true';
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
    throw new Error('Remote-A render precisa de um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'Remote-A - Module Federation',
    description = 'Remote webpack exposto como ESM, pensado para catalogos financeiros e dashboards omnichannel.',
    tagline = 'Bridge MF + Native Federation - carregado sob demanda com isolamento leve.',
    log = true,
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  host.classList.add('mfe-surface');
  if (replace) {
    host.innerHTML = '';
  }

  const card = host.ownerDocument.createElement('section');
  card.className = 'mf-card';

  const badge = host.ownerDocument.createElement('span');
  badge.className = 'mfe-badge';
  badge.textContent = 'Module Federation Remote';

  const heading = host.ownerDocument.createElement('h2');
  heading.textContent = title;

  const descriptionEl = host.ownerDocument.createElement('p');
  descriptionEl.className = 'mfe-description';
  descriptionEl.textContent = description;

  const taglineEl = host.ownerDocument.createElement('p');
  taglineEl.className = 'mfe-tagline';
  taglineEl.textContent = tagline;

  const metrics = host.ownerDocument.createElement('div');
  metrics.className = 'mf-metrics';
  const metricRows = [
    ['SLA', `${(Math.random() * 0.4 + 99.3).toFixed(2)}%`],
    ['Owner', 'Platform Core'],
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
  pingBtn.textContent = 'Emitir BUS (MF)';

  const logArea = host.ownerDocument.createElement('div');
  logArea.className = 'mfe-log';
  logArea.setAttribute('aria-live', 'polite');

  card.append(badge, heading, descriptionEl, taglineEl, metrics, pingBtn);
  if (log) {
    card.appendChild(logArea);
  }

  host.appendChild(card);

  const onPing = () => {
    const current = Number(eventsValueEl?.textContent || '0') + 1;
    if (eventsValueEl) {
      eventsValueEl.textContent = String(current);
    }
    window.dispatchEvent(new CustomEvent('BUS', { detail: { type: 'MF-PING', count: current } }));
    if (log && logArea) {
      logArea.textContent = `BUS emitido pelo Remote-A - total ${current}`;
    }
  };

  const onBus = (event) => {
    if (!log || event.type !== 'BUS' || !logArea) return;
    const detail = typeof event.detail === 'object' ? JSON.stringify(event.detail) : String(event.detail);
    logArea.textContent = `BUS recebido: ${detail}`;
  };

  pingBtn.addEventListener('click', onPing);
  window.addEventListener('BUS', onBus);

  const state = { host, card, pingBtn, logArea, onPing, onBus, detach, replace };
  instances.set(host, state);

  return () => {
    cleanup(state);
    instances.delete(host);
  };
}

export function unmount(ctx = {}) {
  const target =
    ctx && ctx.host instanceof Element
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
