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
    variant = 'full',
    metrics = {},
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }
  host.classList.add('mfe-surface');

  const card = document.createElement('section');
  card.className = `angular-card angular-card--${variant}`;

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

  const metricsRoot = document.createElement('div');
  metricsRoot.className = 'angular-performance';
  const metricsMap = {};
  [
    ['last', 'Ultimo render'],
    ['average', 'Media rolling'],
    ['best', 'Melhor tempo'],
    ['worst', 'Maior tempo'],
    ['count', 'Montagens'],
  ].forEach(([key, label]) => {
    const item = document.createElement('div');
    item.className = 'angular-performance__item';
    const labelEl = document.createElement('span');
    labelEl.className = 'angular-performance__label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'angular-performance__value';
    valueEl.textContent = key === 'count' ? '0' : '--';
    item.append(labelEl, valueEl);
    metricsRoot.appendChild(item);
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

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'angular-btn';
  button.textContent = 'Emitir BUS (Angular)';

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'angular-toggle';

  const details = document.createElement('section');
  details.className = 'angular-details';
  details.innerHTML = `
    <div class="angular-detail-group">
      <h3>Arquitetura remota</h3>
      <ul class="angular-detail-list">
        <li><strong>Tecnologia:</strong> Angular 17 standalone + Signals</li>
        <li><strong>Empacotamento:</strong> createApplication + customElement</li>
        <li><strong>Zone.js:</strong> opcional (com fallback a signals)</li>
      </ul>
    </div>
    <div class="angular-detail-group">
      <h4>Exemplo pratico</h4>
      <p>Dashboard de engajamento que reaproveita components do design system Angular em shells heterogeneos.</p>
    </div>
    <div class="angular-detail-group">
      <h4>Integra</h4>
      <ul class="angular-detail-list">
        <li>Native Federation (ESM puro)</li>
        <li>Module Federation (exposto como remote)</li>
        <li>Legacy AngularJS via wrapper microfrontend</li>
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

  const logArea = document.createElement('div');
  logArea.className = 'angular-log';
  logArea.setAttribute('aria-live', 'polite');
  if (!log) {
    logArea.style.display = 'none';
  }

  const actions = document.createElement('div');
  actions.className = 'angular-actions';
  actions.append(button, toggleBtn);

  card.append(badge, heading, descriptionEl, taglineEl, metricsRoot, actions);
  if (log) card.appendChild(logArea);
  card.appendChild(details);

  host.appendChild(card);

  const onPing = () => {
    const next = Number(metricsMap.count.textContent || '0') + 1;
    metricsMap.count.textContent = String(next);
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

  const onToggle = () => {
    const open = details.dataset.open !== 'true';
    setDetailsState(open);
  };

  button.addEventListener('click', onPing);
  toggleBtn.addEventListener('click', onToggle);
  window.addEventListener('BUS', onBus);

  const state = { host, card, pingBtn: button, onPing, onBus, detach, replace, logArea };
  instances.set(host, state);

  updatePerformance(metrics);

  state.toggleBtn = toggleBtn;
  state.onToggle = onToggle;

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
