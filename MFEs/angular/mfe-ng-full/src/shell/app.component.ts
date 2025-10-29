import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, computed, signal } from '@angular/core';

interface Metrics {
  last?: number | null;
  average?: number | null;
  best?: number | null;
  worst?: number | null;
  count?: number | null;
}

interface FeatureItem {
  title: string;
  summary: string;
}

@Component({
  selector: 'angular-full-mfe-card',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="mfe-card" [class.compact]="variant === 'compact'">
      <header>
        <span class="badge">Angular 17 | Web Component</span>
        <h2>{{ title }}</h2>
        <p class="summary" *ngIf="variant === 'full'">{{ summary }}</p>
      </header>

      <div class="metrics">
        <div class="metric" *ngFor="let metric of telemetryMetrics()">
          <span class="metric-label">{{ metric.label }}</span>
          <span class="metric-value">{{ metric.value }}</span>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="primary" (click)="emitBus()">Emitir BUS (Angular Full)</button>
        <button type="button" class="ghost" (click)="toggleDetails()" [attr.aria-expanded]="detailsOpen()">
          {{ detailsOpen() ? 'Ocultar detalhes' : 'Detalhes da arquitetura' }}
        </button>
      </div>

      <p class="log">{{ logMessage() }}</p>

      <section class="details" [attr.data-open]="detailsOpen()">
        <div class="detail-group">
          <h3>Arquitetura remota</h3>
          <ul class="detail-list">
            <li><strong>Tecnologia</strong><span>Angular 17 standalone + Signals</span></li>
            <li><strong>Empacotamento</strong><span>createApplication + angular/elements</span></li>
            <li><strong>Canal</strong><span>Eventos BUS em formato CustomEvent</span></li>
          </ul>
        </div>
        <div class="detail-group">
          <h4>Exemplo pratico</h4>
          <p>
            Orquestracao de jornadas bancarias com reaproveitamento de componentes Angular em portais Native Federation.
          </p>
        </div>
        <div class="detail-group">
          <h4>Features desta build</h4>
          <ul class="feature-list">
            <li *ngFor="let feature of features">
              <span>{{ feature.title }}</span>
              <small>{{ feature.summary }}</small>
            </li>
          </ul>
        </div>
      </section>
    </section>
  `,
})
export class AppComponent {
  private _variant: 'full' | 'compact' = 'full';
  private readonly metricsSignal = signal<Metrics>({});

  readonly title = 'Angular Full MFE';
  readonly summary = 'Custom element Angular 17 exportado para consumo via Native Federation.';
  readonly events = signal(0);
  readonly detailsOpen = signal(true);
  readonly logMessage = signal('Pronto para emitir BUS');
  readonly features: FeatureItem[] = [
    { title: 'Design system compartilhado', summary: 'Tokens Angular consumidos pelo shell NF.' },
    { title: 'Telemetria nativa', summary: 'Atualiza metricas de render em tempo real.' },
    { title: 'Compatibilidade hibrida', summary: 'Pode ser montado via MF, NF ou Single-SPA.' },
  ];

  readonly telemetryMetrics = computed(() => {
    const data = this.metricsSignal();
    return [
      { label: 'Ultimo render', value: this.formatMetric(data.last) },
      { label: 'Media rolling', value: this.formatMetric(data.average) },
      { label: 'Melhor tempo', value: this.formatMetric(data.best) },
      { label: 'Maior tempo', value: this.formatMetric(data.worst) },
      {
        label: 'Montagens',
        value:
          typeof data.count === 'number' && Number.isFinite(data.count) && data.count > 0
            ? String(data.count)
            : '0',
      },
    ];
  });

  @Input()
  set variant(value: 'full' | 'compact' | undefined) {
    this._variant = value ?? 'full';
    this.detailsOpen.set(this._variant !== 'compact');
  }

  get variant(): 'full' | 'compact' {
    return this._variant;
  }

  @Input()
  set metrics(value: Metrics | null) {
    this.metricsSignal.set(value ?? {});
  }

  get metrics(): Metrics {
    return this.metricsSignal();
  }

  toggleDetails(): void {
    this.detailsOpen.update((open) => !open);
  }

  emitBus(): void {
    const next = this.events() + 1;
    this.events.set(next);
    this.logMessage.set(`BUS emitido pelo Angular Full - total ${next}`);
    window.dispatchEvent(
      new CustomEvent('BUS', {
        detail: {
          type: 'ANGULAR-FULL-PING',
          payload: { count: next, source: 'Angular Full MFE' },
        },
      }),
    );
  }

  formatMetric(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value) || value <= 0) {
      return '--';
    }
    return `${value.toFixed(1)} ms`;
  }
}
