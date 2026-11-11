import { Component, input } from '@angular/core';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  mensaje = input<string>('Cargando...');
}

