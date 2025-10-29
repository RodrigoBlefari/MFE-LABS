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
  state.toggleBtn?.removeEventListener('click', state.onToggle);
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

function formatMetric(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '--';
  }
  return `${value.toFixed(1)} ms`;
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
    variant = 'full',
    metrics = {},
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  host.classList.add('mfe-surface');
  if (replace) {
    host.innerHTML = '';
  }

  const doc = host.ownerDocument ?? document;
  const card = doc.createElement('section');
  card.className = `mf-card mf-card--${variant}`;

  const badge = doc.createElement('span');
  badge.className = 'mf-badge';
  badge.textContent = 'Module Federation Remote';

  const heading = doc.createElement('h2');
  heading.textContent = title;

  const descriptionEl = doc.createElement('p');
  descriptionEl.className = 'mf-description';
  descriptionEl.textContent = description;

  const taglineEl = doc.createElement('p');
  taglineEl.className = 'mf-tagline';
  taglineEl.textContent = tagline;

  const metricsMap = {};
  const performance = doc.createElement('div');
  performance.className = 'mf-performance';
  [
    ['last', 'Ultimo render'],
    ['average', 'Media rolling'],
    ['best', 'Melhor tempo'],
    ['worst', 'Maior tempo'],
    ['count', 'Montagens'],
  ].forEach(([key, label]) => {
    const item = doc.createElement('div');
    item.className = 'mf-performance__item';
    const labelEl = doc.createElement('span');
    labelEl.className = 'mf-performance__label';
    labelEl.textContent = label;
    const valueEl = doc.createElement('span');
    valueEl.className = 'mf-performance__value';
    valueEl.textContent = key === 'count' ? '0' : '--';
    item.append(labelEl, valueEl);
    performance.appendChild(item);
    metricsMap[key] = valueEl;
  });

  const updatePerformance = (data = {}) => {
    metricsMap.last.textContent = formatMetric(data.last);
    metricsMap.average.textContent = formatMetric(data.average);
    metricsMap.best.textContent = formatMetric(data.best);
    metricsMap.worst.textContent = formatMetric(data.worst);
    metricsMap.count.textContent =
      typeof data.count === 'number' && Number.isFinite(data.count) && data.count > 0
        ? String(data.count)
        : metricsMap.count.textContent || '0';
  };

  const actions = doc.createElement('div');
  actions.className = 'mf-actions';

  const pingBtn = doc.createElement('button');
  pingBtn.type = 'button';
  pingBtn.className = 'mf-btn';
  pingBtn.textContent = 'Emitir BUS (Module Federation) Console.log()';

  const toggleBtn = doc.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'mf-toggle';

  const details = doc.createElement('section');
  details.className = 'mf-details';
  details.innerHTML = `
    <div class="mf-detail-group">
      <h3>Arquitetura remota</h3>
      <ul class="mf-detail-list">
        <li><strong>Tecnologia:</strong> webpack 5 Module Federation</li>
        <li><strong>Exposed:</strong> ./widget @ remote-a</li>
        <li><strong>Bundle:</strong> Shared Runtime + ESM wrapper</li>
      </ul>
    </div>
    <div class="mf-detail-group">
      <h4>Fluxo pratico</h4>
      <p>Consumido por hosts MF, Single-SPA ou Native Federation via adaptador ESM com isolamento de dependencias.</p>
    </div>
    <div class="mf-detail-group">
      <h4>Dependencias compartilhadas</h4>
      <ul class="mf-detail-list">
        <li>React 18 (singleton)</li>
        <li>Design System interno</li>
        <li>Canal de eventos BUS</li>
      </ul>
    </div>
  `;

  const setDetailsState = (open) => {
    details.dataset.open = open ? 'true' : 'false';
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleBtn.textContent = open ? 'Ocultar detalhes' : 'Detalhes da arquitetura';
  };

  const defaultOpen = variant !== 'compact';
  setDetailsState(defaultOpen);

  const logArea = doc.createElement('div');
  logArea.className = 'mf-log';
  logArea.setAttribute('aria-live', 'polite');
  if (!log) {
    logArea.style.display = 'none';
  }

  actions.append(pingBtn, toggleBtn);
  card.append(badge, heading, descriptionEl, taglineEl, performance, actions);
  if (log) {
    card.appendChild(logArea);
  }
  card.appendChild(details);
  host.appendChild(card);

  const onPing = () => {
    const current = Number(metricsMap.count.textContent || '0') + 1;
    metricsMap.count.textContent = String(current);
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

  const onToggle = () => {
    const open = details.dataset.open !== 'true';
    setDetailsState(open);
  };

  pingBtn.addEventListener('click', onPing);
  toggleBtn.addEventListener('click', onToggle);
  window.addEventListener('BUS', onBus);

  const state = {
    host,
    card,
    pingBtn,
    toggleBtn,
    logArea,
    onPing,
    onBus,
    onToggle,
    detach,
    replace,
  };

  instances.set(host, state);
  updatePerformance(metrics);

  return {
    updateMetrics: (next) => updatePerformance(next ?? {}),
    destroy: () => {
      cleanup(state);
      instances.delete(host);
    },
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
