import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.css'
})
export class ShellLayoutComponent {
  readonly mfes = signal([
    { id: 'ng-full', label: 'Angular 20 NF', url: 'http://localhost:9400/mfe-ng-full.js', port: 9400 },
    { id: 'vue', label: 'Vue 3', url: 'http://localhost:9001/mfe-vue.js', port: 9001 },
    { id: 'react', label: 'React 18', url: 'http://localhost:9201/mfe-react.js', port: 9201 },
    { id: 'nf', label: 'Native Federation', url: 'http://localhost:9101/mfe1.js', port: 9101 },
    { id: 'mf', label: 'Module Federation', url: 'http://localhost:9301/remote-a.js', port: 9301 },
    { id: 'ssa', label: 'Single-SPA', url: 'http://localhost:9302/mfe-a.js', port: 9302 },
    { id: 'ng', label: 'Angular 15', url: 'http://localhost:9310/mfe-ng.js', port: 9310 },
  ]);

  readonly status = signal('Pronto para carregar MFEs');
  readonly loading = signal(false);

  async loadMfe(mfe: any) {
    this.status.set(`Carregando ${mfe.label}...`);
    this.loading.set(true);

    try {
      const mod = await import(/* @vite-ignore */ mfe.url);
      const outlet = document.getElementById('mfe-outlet');
      
      if (mod.render && outlet) {
        await mod.render(outlet, { host: 'angular-shell-20', id: mfe.id });
        this.status.set(`${mfe.label} carregado com sucesso!`);
      } else {
        this.status.set(`${mfe.label} carregado (sem método render detectado)`);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${mfe.label}:`, error);
      this.status.set(`Erro ao carregar ${mfe.label}. MFE rodando na porta ${mfe.port}?`);
    } finally {
      this.loading.set(false);
    }
  }

  clearStage() {
    const outlet = document.getElementById('mfe-outlet');
    if (outlet) {
      outlet.innerHTML = '';
      this.status.set('Palco limpo. Pronto para carregar MFEs.');
    }
  }
}
