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
    variant = 'full',
    metrics = {},
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

  const doc = host.ownerDocument ?? document;
  const card = doc.createElement('section');
  card.className = `ssa-card ssa-card--${variant}`;

  const badge = doc.createElement('span');
  badge.className = 'ssa-badge';
  badge.textContent = 'Single-SPA Remote';

  const heading = doc.createElement('h2');
  heading.textContent = title;

  const descriptionEl = doc.createElement('p');
  descriptionEl.className = 'ssa-description';
  descriptionEl.textContent = description;

  const taglineEl = doc.createElement('p');
  taglineEl.className = 'ssa-tagline';
  taglineEl.textContent = tagline;

  const metricsRoot = doc.createElement('div');
  metricsRoot.className = 'ssa-performance';
  const metricsMap = {};
  [
    ['last', 'Ultimo render'],
    ['average', 'Media rolling'],
    ['best', 'Melhor tempo'],
    ['worst', 'Maior tempo'],
    ['count', 'Montagens'],
  ].forEach(([key, label]) => {
    const item = doc.createElement('div');
    item.className = 'ssa-performance__item';
    const labelEl = doc.createElement('span');
    labelEl.className = 'ssa-performance__label';
    labelEl.textContent = label;
    const valueEl = doc.createElement('span');
    valueEl.className = 'ssa-performance__value';
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

  const pingBtn = doc.createElement('button');
  pingBtn.type = 'button';
  pingBtn.className = 'mfe-btn';
  pingBtn.textContent = 'Emitir PING Console.log()';

  const toggleBtn = doc.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'ssa-toggle';

  const details = doc.createElement('section');
  details.className = 'ssa-details';
  details.innerHTML = `
    <div class="ssa-detail-group">
      <h3>Arquitetura remota</h3>
      <ul class="ssa-detail-list">
        <li><strong>Lifecycle:</strong> bootstrap/mount/unmount padrao Single-SPA</li>
        <li><strong>Integracao:</strong> Wrapper ESM exportado para hosts Native/MF</li>
        <li><strong>Versao alvo:</strong> Single-SPA 5.x</li>
      </ul>
    </div>
    <div class="ssa-detail-group">
      <h4>Exemplo pratico</h4>
      <p>Aplicacao legado AngularJS coexistindo com React e Vue em um orquestrador Single-SPA corporativo.</p>
    </div>
    <div class="ssa-detail-group">
      <h4>Como consumir</h4>
      <ul class="ssa-detail-list">
        <li>Registrar via SystemJS e montar sob demanda</li>
        <li>Utilizar adaptador ESM em hosts Native Federation</li>
        <li>Propagar eventos pelo canal BUS unificado</li>
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
  logArea.className = 'mfe-log';
  logArea.setAttribute('aria-live', 'polite');
  if (!log) {
    logArea.style.display = 'none';
  }

  const actions = doc.createElement('div');
  actions.className = 'ssa-actions';
  actions.append(pingBtn, toggleBtn);

  card.append(badge, heading, descriptionEl, taglineEl, metricsRoot, actions);
  if (log) card.appendChild(logArea);
  card.appendChild(details);

  host.appendChild(card);

  const updateMetricsFn = (next) => updatePerformance(next ?? {});
  updateMetricsFn(metrics);

  const onPing = () => {
    const next = Number(metricsMap.count.textContent || '0') + 1;
    metricsMap.count.textContent = String(next);
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
    logArea,
    onPing,
    onBus,
    toggleBtn,
    onToggle,
    detach,
    replace,
  };

  instances.set(host, state);

  return {
    updateMetrics: updateMetricsFn,
    destroy: () => {
      cleanup(state);
      instances.delete(host);
    },
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
