// Importamos Component y la función input para signals reactivas
import { Component, input } from '@angular/core';

/**
 * Componente standalone reutilizable para estados de carga visual.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.css'
})
export class SpinnerComponent {
  // Signal Input que recibe el texto descriptivo del estado de carga (por defecto 'Cargando...')
  mensaje = input<string>('Cargando...');
}
