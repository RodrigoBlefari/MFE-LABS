import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="dashboard">
      <header>
        <h2>Visao geral</h2>
        <p>Angular Full MFE como base para componentes federados com design consistente.</p>
      </header>
      <div class="stats">
        <article>
          <span class="label">Disponibilidade</span>
          <span class="value">99,98%</span>
        </article>
        <article>
          <span class="label">Latencia</span>
          <span class="value">42 ms</span>
        </article>
        <article>
          <span class="label">Deploys semanais</span>
          <span class="value">12</span>
        </article>
      </div>
      <ul class="feature-list">
        <li>
          <span class="title">Design tokens</span>
          <span class="description">Compartilhados entre Native Federation e Angular CLI.</span>
        </li>
        <li>
          <span class="title">Observabilidade</span>
          <span class="description">Metricas emitidas pelo canal BUS para dashboards corporativos.</span>
        </li>
        <li>
          <span class="title">Compatibilidade</span>
          <span class="description">Pode ser exposto como remote Module Federation sem ajustes.</span>
        </li>
      </ul>
    </section>
  `,
  styles: [`
    .dashboard { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08); }
    header h2 { margin: 0; font-size: 1.6rem; }
    header p { margin: 0.25rem 0 1.5rem; color: #475569; }
    .stats { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    article { padding: 1rem; border-radius: 16px; background: linear-gradient(135deg, #cffafe, #e0f2fe); display: flex; flex-direction: column; gap: 0.35rem; }
    .label { font-size: 0.9rem; color: #0f172a; opacity: 0.8; }
    .value { font-size: 1.4rem; font-weight: 700; color: #0f172a; }
    .feature-list { list-style: none; margin: 1.5rem 0 0; padding: 0; display: grid; gap: 0.85rem; }
    .feature-list li { padding: 0.85rem 1rem; border-radius: 14px; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); display: grid; gap: 0.35rem; }
    .feature-list .title { font-weight: 600; color: #0f172a; }
    .feature-list .description { color: #475569; font-size: 0.9rem; }
  `],
})
export class DashboardPageComponent {}

