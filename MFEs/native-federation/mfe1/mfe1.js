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
  card.className = `nf-card nf-card--${variant}`;

  const badge = doc.createElement('span');
  badge.className = 'nf-badge';
  badge.textContent = 'Native Federation Remote';

  const heading = doc.createElement('h2');
  heading.textContent = title;

  const descriptionEl = doc.createElement('p');
  descriptionEl.className = 'nf-description';
  descriptionEl.textContent = description;

  const taglineEl = doc.createElement('p');
  taglineEl.className = 'nf-tagline';
  taglineEl.textContent = tagline;

  const metricsMap = {};
  const performance = doc.createElement('div');
  performance.className = 'nf-performance';
  [
    ['last', 'Ultimo render'],
    ['average', 'Media rolling'],
    ['best', 'Melhor tempo'],
    ['worst', 'Maior tempo'],
    ['count', 'Montagens'],
  ].forEach(([key, label]) => {
    const item = doc.createElement('div');
    item.className = 'nf-performance__item';
    const labelEl = doc.createElement('span');
    labelEl.className = 'nf-performance__label';
    labelEl.textContent = label;
    const valueEl = doc.createElement('span');
    valueEl.className = 'nf-performance__value';
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
  actions.className = 'nf-actions';

  const pingBtn = doc.createElement('button');
  pingBtn.type = 'button';
  pingBtn.className = 'nf-btn';
  pingBtn.textContent = 'Emitir BUS (Native Federation)';

  const toggleBtn = doc.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'nf-toggle';

  const details = doc.createElement('section');
  details.className = 'nf-details';
  details.innerHTML = `
    <div class="nf-detail-group">
      <h3>Arquitetura remota</h3>
      <ul class="nf-detail-list">
        <li><strong>Tecnologia:</strong> JavaScript ESM + CustomEvent</li>
        <li><strong>Framework:</strong> Nenhum (build-less, zero bundler)</li>
        <li><strong>Versao:</strong> ECMAScript 2022</li>
      </ul>
    </div>
    <div class="nf-detail-group">
      <h4>Exemplo pratico</h4>
      <p>Stream de eventos de open finance habilitando dashboards em canais mobile e web sem empacotamento adicional.</p>
    </div>
    <div class="nf-detail-group">
      <h4>Orquestradores suportados</h4>
      <ul class="nf-detail-list">
        <li>Native Federation Shell (bus unificado)</li>
        <li>Module Federation host com bridge ESM</li>
        <li>Single-SPA via adaptadores de lifecycle</li>
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
  logArea.className = 'nf-log';
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
    const detail = { type: 'NF-PING', count: current };
    window.dispatchEvent(new CustomEvent('BUS', { detail }));
    if (typeof onBus === 'function') {
      onBus(detail);
    }
    if (log && logArea) {
      logArea.textContent = `BUS emitido pelo Native Federation - total ${current}`;
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

  const onToggle = () => {
    const open = details.dataset.open !== 'true';
    setDetailsState(open);
  };

  pingBtn.addEventListener('click', onPing);
  toggleBtn.addEventListener('click', onToggle);
  window.addEventListener('BUS', onBusHandler);

  const state = {
    host,
    card,
    pingBtn,
    toggleBtn,
    logArea,
    onPing,
    onBus: onBusHandler,
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
