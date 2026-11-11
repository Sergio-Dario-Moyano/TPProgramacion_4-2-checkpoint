import { AfterViewInit, Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Directiva propia: appAutoResize (Sprint 4).
 * Hace que un textarea crezca a medida que se escribe, sin barra de scroll, hasta un alto máximo.
 * Uso: <textarea appAutoResize formControlName="descripcion"></textarea>
 */
@Directive({
  selector: 'textarea[appAutoResize]',
  standalone: true
})
export class AutoResizeDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);
  private readonly altoMaximo = 360;

  ngAfterViewInit(): void {
    // Espera un ciclo para tomar el valor inicial cargado por el formulario
    setTimeout(() => this.ajustar());
  }

  @HostListener('input')
  ajustar(): void {
    const textarea = this.el.nativeElement;
    textarea.style.height = 'auto';
    const alto = Math.min(textarea.scrollHeight + 2, this.altoMaximo);
    textarea.style.height = `${alto}px`;
    textarea.style.overflowY = textarea.scrollHeight > this.altoMaximo ? 'auto' : 'hidden';
  }
}
