const instances = new Map();

function ensureStylesheet() {
  if (document.querySelector('link[data-angular-mfe-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-ng.css', import.meta.url).href;
  link.dataset.angularMfeStyle = 'true';
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

export async function render(outlet, options = {}) {
  ensureStylesheet();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('Angular remote requer um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'Angular Engagement Dashboard',
    description = 'Simulacao de Web Component Angular standalone com Signals, ideal para orquestracao corporativa.',
    tagline = 'Empacotado como Custom Element e integrado via Native Federation.',
    log = true,
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }
  host.classList.add('mfe-surface');

  const card = document.createElement('section');
  card.className = 'angular-card';

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = 'Angular | Web Component (simulado)';

  const heading = document.createElement('h2');
  heading.textContent = title;

  const descriptionEl = document.createElement('p');
  descriptionEl.textContent = description;

  const taglineEl = document.createElement('p');
  taglineEl.className = 'tagline';
  taglineEl.textContent = tagline;

  const metrics = document.createElement('dl');
  const metricRows = [
    ['Status', 'Operacional'],
    ['Versao', '17.x (standalone)'],
    ['Eventos enviados', '0'],
  ];
  let eventsEntry = null;
  metricRows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    metrics.append(dt, dd);
    if (label === 'Eventos enviados') {
      eventsEntry = dd;
    }
  });

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'Emitir BUS (Angular)';

  const logArea = document.createElement('div');
  logArea.className = 'angular-log';
  logArea.setAttribute('aria-live', 'polite');

  card.append(badge, heading, descriptionEl, taglineEl, metrics, button);
  if (log) {
    card.appendChild(logArea);
  }

  host.appendChild(card);

  const onPing = () => {
    const next = Number(eventsEntry?.textContent || '0') + 1;
    if (eventsEntry) eventsEntry.textContent = String(next);
    window.dispatchEvent(
      new CustomEvent('BUS', {
        detail: {
          type: 'ANGULAR-PING',
          payload: { count: next, source: 'Angular Web Component (simulado)' },
        },
      }),
    );
    if (log && logArea) {
      logArea.textContent = `BUS emitido pelo Angular remote - total ${next}`;
    }
  };

  const onBus = (event) => {
    if (!log || event.type !== 'BUS' || !logArea) return;
    const detail = typeof event.detail === 'object' ? JSON.stringify(event.detail) : String(event.detail);
    logArea.textContent = `BUS recebido: ${detail}`;
  };

  button.addEventListener('click', onPing);
  window.addEventListener('BUS', onBus);

  const state = { host, card, pingBtn: button, onPing, onBus, detach, replace, logArea };
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
