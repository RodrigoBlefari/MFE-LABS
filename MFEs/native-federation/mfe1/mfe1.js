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
    title = 'Native Federation - Event Stream',
    description = 'MFE ESM direto, ideal para times que desejam aderir a federacao sem empacotadores pesados.',
    tagline = 'Emitido via CustomEvent - integracao agnostica com Module/Single-SPA.',
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
  card.className = 'nf-card';

  const badge = host.ownerDocument.createElement('span');
  badge.className = 'nf-badge';
  badge.textContent = 'Native Federation Remote';

  const heading = host.ownerDocument.createElement('h2');
  heading.textContent = title;

  const descriptionEl = host.ownerDocument.createElement('p');
  descriptionEl.className = 'nf-description';
  descriptionEl.textContent = description;

  const taglineEl = host.ownerDocument.createElement('p');
  taglineEl.className = 'nf-tagline';
  taglineEl.textContent = tagline;

  const metrics = host.ownerDocument.createElement('div');
  metrics.className = 'nf-metrics';
  const metricRows = [
    ['Latencia media', `${(Math.random() * 20 + 12).toFixed(0)} ms`],
    ['Roteadores ativos', `${(Math.random() * 4 + 3).toFixed(0)}`],
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
  pingBtn.textContent = 'Emitir BUS (NF)';

  const logArea = host.ownerDocument.createElement('div');
  logArea.className = 'mfe-log';
  logArea.setAttribute('aria-live', 'polite');

  card.append(badge, heading, descriptionEl, taglineEl, metrics, pingBtn);
  if (log) {
    card.appendChild(logArea);
  }

  host.appendChild(card);

  const onPing = () => {
    const total = Number(eventsValueEl?.textContent || '0') + 1;
    if (eventsValueEl) {
      eventsValueEl.textContent = String(total);
    }
    const detail = { type: 'NF-PING', count: total };
    window.dispatchEvent(new CustomEvent('BUS', { detail }));
    if (typeof onBus === 'function') {
      onBus(detail);
    }
    if (log && logArea) {
      logArea.textContent = `BUS emitido pelo MFE1 - total ${total}`;
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
