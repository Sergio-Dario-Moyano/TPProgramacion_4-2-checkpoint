// Importamos utilidades del ciclo de vida y referencias al elemento del DOM
import { Directive, ElementRef, HostListener, OnInit, AfterViewInit } from '@angular/core';

/**
 * Directiva de atributo que calcula y auto-expande la altura del textarea
 * según el volumen de texto ingresado por el usuario.
 */
@Directive({
  // Se aplica como atributo a cualquier elemento textarea mediante 'appAutoResize'
  selector: 'textarea[appAutoResize]',
  // Declarada como standalone para su libre importación
  standalone: true
})
export class AutoResizeDirective implements OnInit, AfterViewInit {
  // Inyectamos la referencia nativa al elemento del DOM
  constructor(private elementRef: ElementRef) {}

  // Ajuste inicial al instanciar el componente
  ngOnInit(): void {
    this.ajustarAltura();
  }

  // Ajuste posterior al renderizado visual de la vista
  ngAfterViewInit(): void {
    this.ajustarAltura();
  }

  // Escuchamos el evento nativo de escritura 'input' en el textarea
  @HostListener('input')
  onInput(): void {
    this.ajustarAltura();
  }

  /**
   * Calcula y asigna la altura en píxeles correspondiente al scrollHeight.
   */
  private ajustarAltura(): void {
    // Obtenemos la referencia nativa del textarea
    const textarea = this.elementRef.nativeElement as HTMLTextAreaElement;

    // Reseteamos primero la altura para recalcular correctamente si el usuario borra texto
    textarea.style.height = 'auto';
    // Asignamos la nueva altura calculada según el contenido actual
    textarea.style.height = `${textarea.scrollHeight}px`;
    // Ocultamos la barra de scroll vertical nativa
    textarea.style.overflow = 'hidden';
  }
}
