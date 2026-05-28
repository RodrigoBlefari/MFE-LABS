import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellLayoutComponent } from './components/shell-layout/shell-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellLayoutComponent],
  template: '<app-shell-layout />',
  styles: []
})
export class App {
  title = 'Angular 20 Host Shell - Native Federation';
}
