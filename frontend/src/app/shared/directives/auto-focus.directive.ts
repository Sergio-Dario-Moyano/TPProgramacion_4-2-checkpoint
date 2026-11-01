// Importamos utilidades de ciclo de vida e inyección de ElementRef
import { Directive, ElementRef, AfterViewInit } from '@angular/core';

/**
 * Directiva de atributo que sitúa el cursor de enfoque automáticamente
 * sobre el campo de entrada al renderizarse en pantalla.
 */
@Directive({
  // Selector que permite aplicarlo mediante el atributo [appAutofocus]
  selector: '[appAutofocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  // Inyectamos la referencia nativa del elemento objetivo
  constructor(private el: ElementRef) {}

  // Se ejecuta una vez que la vista del componente ha sido inicializada
  ngAfterViewInit(): void {
    // Retardo controlado de 100ms para asegurar la estabilidad del DOM antes de aplicar el foco
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 100);
  }
}
