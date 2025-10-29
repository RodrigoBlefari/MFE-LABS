import { defineCustomElement, h, ref, computed, watch } from './node_modules/vue/dist/vue.runtime.esm-browser.prod.js';

const instances = new Map();
let elementDefined = false;

function ensureStylesheet() {
  if (document.querySelector('link[data-vue-mfe-style]')) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./mfe-vue.css', import.meta.url).href;
  link.dataset.vueMfeStyle = 'true';
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
  if (state.element?.isConnected) {
    state.element.remove();
  }
  if (state.detach && state.host?.isConnected) {
    state.host.remove();
  }
}

function defineVueElement() {
  if (elementDefined || customElements.get('vue-mf-card')) {
    elementDefined = true;
    return;
  }

  const VueMfeCard = defineCustomElement({
    props: {
      title: { type: String, default: 'Vue Operational Insights' },
      description: {
        type: String,
        default: 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
      },
      tagline: {
        type: String,
        default: 'defineCustomElement + Composition API para maxima flexibilidade.',
      },
      metrics: {
        type: Object,
        default: () => ({}),
      },
      variant: {
        type: String,
        default: 'full',
      },
    },
    setup(props, { expose }) {
      const pings = ref(0);
      const detailsOpen = ref(props.variant !== 'compact');
      const perf = ref(props.metrics ?? {});

      watch(
        () => props.metrics,
        (next) => {
          perf.value = next ?? {};
        },
        { deep: true },
      );

      watch(
        () => props.variant,
        (value) => {
          if (value === 'compact') {
            detailsOpen.value = false;
          }
        },
      );

      const formatMetric = (value) => {
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
          return '--';
        }
        return `${value.toFixed(1)} ms`;
      };

      const emitPing = () => {
        pings.value += 1;
        window.dispatchEvent(
          new CustomEvent('BUS', {
            detail: {
              type: 'VUE-PING',
              payload: {
                count: pings.value,
                source: 'Vue Custom Element',
              },
            },
          }),
        );
      };

      const toggleDetails = () => {
        detailsOpen.value = !detailsOpen.value;
      };

      const performanceRows = computed(() => [
        ['Ultimo render', formatMetric(perf.value.last)],
        ['Media rolling', formatMetric(perf.value.average)],
        ['Melhor tempo', formatMetric(perf.value.best)],
        ['Maior tempo', formatMetric(perf.value.worst)],
        [
          'Montagens',
          typeof perf.value.count === 'number' && Number.isFinite(perf.value.count) && perf.value.count > 0
            ? String(perf.value.count)
            : '0',
        ],
        ['Eventos enviados', String(pings.value)],
      ]);

      expose({
        updateMetrics(next) {
          perf.value = next ?? {};
        },
      });

      return {
        props,
        pings,
        perf,
        performanceRows,
        formatMetric,
        detailsOpen,
        emitPing,
        toggleDetails,
      };
    },
    render() {
      const cardClasses = ['vue-card', `vue-card--${this.props.variant}`];
      const rows = Array.isArray(this.performanceRows?.value) ? this.performanceRows.value : [];
      return h('section', { class: cardClasses }, [
        h('span', { class: 'vue-badge' }, 'Vue Custom Element'),
        h('h2', null, this.props.title),
        h('p', { class: 'vue-description' }, this.props.description),
        h('p', { class: 'vue-tagline' }, this.props.tagline),
        h(
          'div',
          { class: 'vue-performance' },
          rows.map(([label, value]) =>
            h('div', { class: 'vue-performance__item', key: label }, [
              h('span', { class: 'vue-performance__label' }, label),
              h('span', { class: 'vue-performance__value' }, value),
            ]),
          ),
        ),
        h('div', { class: 'vue-actions' }, [
          h(
            'button',
            {
              type: 'button',
              onClick: this.emitPing,
            },
            'Emitir BUS (Vue)',
          ),
          h(
            'button',
            {
              type: 'button',
              'aria-expanded': this.detailsOpen,
              onClick: this.toggleDetails,
            },
            this.detailsOpen ? 'Ocultar detalhes' : 'Detalhes da arquitetura',
          ),
        ]),
        h(
          'section',
          {
            class: ['vue-details', this.detailsOpen ? 'vue-details--open' : 'vue-details--closed'],
          },
          this.detailsOpen
            ? [
                h('div', { class: 'vue-detail-group' }, [
                  h('h3', null, 'Arquitetura remota'),
                  h('ul', { class: 'vue-detail-list' }, [
                    h('li', null, [
                      h('strong', null, 'Tecnologia'),
                      h('span', null, 'Vue 3.4 + defineCustomElement'),
                    ]),
                    h('li', null, [
                      h('strong', null, 'Estilo'),
                      h('span', null, 'Scoped CSS + tokens globais'),
                    ]),
                    h('li', null, [
                      h('strong', null, 'Eventos'),
                      h('span', null, 'Publica metricas via BUS unificado'),
                    ]),
                  ]),
                ]),
                h('div', { class: 'vue-detail-group' }, [
                  h('h4', null, 'Exemplo pratico'),
                  h(
                    'p',
                    null,
                    'Painel operacional que monitora SLAs e gera insights para squads de SRE e observabilidade.',
                  ),
                ]),
                h('div', { class: 'vue-detail-group' }, [
                  h('h4', null, 'Consumo em hosts'),
                  h('ul', { class: 'vue-detail-list' }, [
                    h('li', null, [
                      h('strong', null, 'Native Federation'),
                      h('span', null, 'Importacao dinamica sem bundler'),
                    ]),
                    h('li', null, [
                      h('strong', null, 'Module Federation'),
                      h('span', null, 'Exposto como remote federado'),
                    ]),
                    h('li', null, [
                      h('strong', null, 'Single-SPA'),
                      h('span', null, 'Adapter com lifecycle mount/unmount'),
                    ]),
                  ]),
                ]),
              ]
            : null,
        ),
      ]);
    },
  });

  customElements.define('vue-mf-card', VueMfeCard);
  elementDefined = true;
}

export async function render(outlet, options = {}) {
  ensureStylesheet();
  defineVueElement();

  if (outlet && !(outlet instanceof Element)) {
    throw new Error('Vue remote requer um elemento host valido.');
  }

  const {
    appendTo = document.body,
    replace = true,
    title = 'Vue Operational Insights',
    description = 'Vue 3 rodando como Custom Element, perfeito para integracoes heterogeneas.',
    tagline = 'defineCustomElement + Composition API para maxima flexibilidade.',
    variant = 'full',
    metrics = {},
  } = options;

  const hostProvided = outlet instanceof Element;
  const host = hostProvided ? outlet : createOutlet({ mountPoint: appendTo, append: true });
  const detach = !hostProvided;

  if (replace) {
    host.innerHTML = '';
  }

  const element = document.createElement('vue-mf-card');
  element.setAttribute('title', title);
  element.setAttribute('description', description);
  element.setAttribute('tagline', tagline);
  element.variant = variant;
  element.metrics = metrics;
  element.updateMetrics?.(metrics);

  host.appendChild(element);

  const state = { host, element, detach, replace };
  instances.set(host, state);

  return {
    updateMetrics: (next) => {
      if (typeof element.updateMetrics === 'function') {
        element.updateMetrics(next);
      } else {
        element.metrics = next ?? {};
      }
    },
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
