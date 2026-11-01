// Importamos utilidades de ciclo de vida y ElementRef
import { Directive, ElementRef, OnInit } from '@angular/core';

/**
 * Directiva que escucha el desplazamiento de pantalla mediante IntersectionObserver
 * y añade la clase visual de entrada una sola vez al aparecer en el viewport.
 */
@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit {
  // Inyectamos la referencia del elemento que se revelará con scroll
  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    // Creamos la instancia del observador nativo de intersección
    const observer = new IntersectionObserver(
      (entries) => {
        // Recorremos las entradas detectadas en el rango visual
        entries.forEach((entry) => {
          // Si el elemento entra en la zona visible (mínimo 10%)
          if (entry.isIntersecting) {
            // Añadimos la clase CSS que activa la transición o animación
            entry.target.classList.add('reveal-active');
            // Dejamos de observar el elemento para no consumir recursos innecesarios
            observer.unobserve(entry.target);
          }
        });
      },
      // Umbral de activación configurado al 10% de visibilidad del elemento
      { threshold: 0.1 }
    );

    // Comenzamos la observación sobre el nodo nativo
    observer.observe(this.el.nativeElement);
  }
}
