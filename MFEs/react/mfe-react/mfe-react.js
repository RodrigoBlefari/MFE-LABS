import React, { useEffect, useState } from 'https://cdn.jsdelivr.net/npm/react@18.2.0/+esm';
import { createRoot } from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/client/+esm';

const instances = new Map();
let elementDefined = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-react-mfe-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-react.css', import.meta.url).href;
  link.dataset.reactMfeStyle = 'true';
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
  if (state.root) {
    state.root.unmount();
  }
  if (state.element?.isConnected) {
    state.element.remove();
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

function ReactCard({
  title,
  description,
  tagline,
  color = '#61dafb',
  variant = 'full',
  metrics = {},
}) {
  const [pings, setPings] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(variant !== 'compact');
  const [perf, setPerf] = useState(metrics ?? {});
  const [logMessage, setLogMessage] = useState('Pronto para emitir BUS');

  useEffect(() => {
    setPerf(metrics ?? {});
  }, [metrics]);

  useEffect(() => {
    if (variant === 'compact') {
      setDetailsOpen(false);
    }
  }, [variant]);

  const emitPing = () => {
    const next = pings + 1;
    setPings(next);
    setLogMessage(`BUS emitido pelo React remote - total ${next}`);
    window.dispatchEvent(
      new CustomEvent('BUS', {
        detail: {
          type: 'REACT-PING',
          payload: {
            count: next,
            source: 'React Federation Widget',
          },
        },
      }),
    );
  };

  const performanceRows = [
    ['Ultimo render', formatMetric(perf.last)],
    ['Media rolling', formatMetric(perf.average)],
    ['Melhor tempo', formatMetric(perf.best)],
    ['Maior tempo', formatMetric(perf.worst)],
    [
      'Montagens',
      typeof perf.count === 'number' && Number.isFinite(perf.count) && perf.count > 0
        ? String(perf.count)
        : '0',
    ],
    ['Eventos enviados', String(pings)],
  ];

  return React.createElement(
    'section',
    { className: `react-card react-card--${variant}`, style: { borderColor: color } },
    React.createElement('span', { className: 'react-badge' }, 'React Web Component'),
    React.createElement('h2', null, title),
    React.createElement('p', { className: 'react-description' }, description),
    React.createElement('p', { className: 'react-tagline' }, tagline),
    React.createElement(
      'div',
      { className: 'react-performance' },
      performanceRows.map(([label, value]) =>
        React.createElement(
          'div',
          { className: 'react-performance__item', key: label },
          React.createElement('span', { className: 'react-performance__label' }, label),
          React.createElement('span', { className: 'react-performance__value' }, value),
        ),
      ),
    ),
    React.createElement(
      'div',
      { className: 'react-actions' },
      React.createElement(
        'button',
        { type: 'button', onClick: emitPing },
        'Emitir BUS (React)',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => setDetailsOpen((open) => !open),
          'aria-expanded': detailsOpen,
        },
        detailsOpen ? 'Ocultar detalhes' : 'Detalhes da arquitetura',
      ),
    ),
    React.createElement('div', { className: 'react-log' }, logMessage),
    detailsOpen &&
      React.createElement(
        'section',
        { className: 'react-details' },
        React.createElement(
          'div',
          { className: 'react-detail-group' },
          React.createElement('h3', null, 'Arquitetura remota'),
          React.createElement(
            'ul',
            { className: 'react-detail-list' },
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Tecnologia'),
              React.createElement('span', null, 'React 18.2 + ReactDOM.createRoot'),
            ),
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Isolamento'),
              React.createElement('span', null, 'Custom Element com shadow opcional'),
            ),
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Observabilidade'),
              React.createElement('span', null, 'Emissao de metricas via canal BUS'),
            ),
          ),
        ),
        React.createElement(
          'div',
          { className: 'react-detail-group' },
          React.createElement('h4', null, 'Exemplo pratico'),
          React.createElement(
            'p',
            null,
            'Widget de observabilidade que monitora latencia e eventos de servicos em tempo real.',
          ),
        ),
        React.createElement(
          'div',
          { className: 'react-detail-group' },
          React.createElement('h4', null, 'Consumo em hosts'),
          React.createElement(
            'ul',
            { className: 'react-detail-list' },
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Native Federation'),
              React.createElement('span', null, 'Importacao ESM direta com telemetria'),
            ),
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Module Federation'),
              React.createElement('span', null, 'Bridge wrapper exposto como remote'),
            ),
            React.createElement(
              'li',
              null,
              React.createElement('strong', null, 'Single-SPA'),
              React.createElement('span', null, 'Adapter para lifecycle customizado'),
            ),
          ),
        ),
      ),
  );
}

function defineElement() {
  if (elementDefined || customElements.get('react-mf-card')) {
    elementDefined = true;
    return;
  }

  class ReactMfeElement extends HTMLElement {
    static observedAttributes = ['title', 'description', 'tagline', 'color', 'variant'];

    constructor() {
      super();
      this._props = {};
      this._metrics = {};
      this._root = null;
    }

    attributeChangedCallback(name, _oldValue, newValue) {
      this._props[name] = newValue;
      this.update();
    }

    set metrics(value) {
      this._metrics = value ?? {};
      this.update();
    }

    get metrics() {
      return this._metrics;
    }

    set variant(value) {
      this._props.variant = value;
      this.update();
    }

    get variant() {
      return this._props.variant ?? 'full';
    }

    connectedCallback() {
      if (!this._root) {
        this._root = createRoot(this);
      }
      this.update();
    }

    disconnectedCallback() {
      if (this._root) {
        this._root.unmount();
        this._root = null;
      }
    }

    update() {
      if (!this._root) return;
      const props = {
        title: this._props.title ?? this.title ?? 'React Observability Widget',
        description:
          this._props.description ??
          this.description ??
          'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
        tagline:
          this._props.tagline ??
          this.tagline ??
          'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
        color: this._props.color ?? this.color ?? '#61dafb',
        variant: this.variant,
        metrics: this._metrics,
      };
      this._root.render(React.createElement(ReactCard, props));
    }

    updateMetrics(next) {
      this.metrics = next ?? {};
    }
  }

  customElements.define('react-mf-card', ReactMfeElement);
  elementDefined = true;
}

export async function render(outlet, options = {}) {
  ensureStylesheet();
  defineElement();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('React remote requer um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'React Observability Widget',
    description = 'React 18 rodando como Web Component, ideal para integracoes Nx com Module Federation.',
    tagline = 'Criado com ReactDOM.createRoot + Custom Elements para isolamento leve.',
    color = '#61dafb',
    variant = 'full',
    metrics = {},
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }

  const element = document.createElement('react-mf-card');
  element.title = title;
  element.description = description;
  element.tagline = tagline;
  element.color = color;
  element.variant = variant;
  element.metrics = metrics;

  host.appendChild(element);

  const root = element._root ?? null;
  const state = { host, element, root, detach, replace };
  instances.set(host, state);

  return {
    updateMetrics: (next) => element.updateMetrics(next),
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
