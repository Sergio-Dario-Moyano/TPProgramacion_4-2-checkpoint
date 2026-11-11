import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/** Avatar por defecto incluido en /public/assets. */
export const AVATAR_POR_DEFECTO = 'assets/avatar-default.svg';

/**
 * Directiva propia: appImagenFallback (Sprint 4).
 * Si la imagen no carga (URL vacía, rota o eliminada de Cloudinary) la reemplaza por una imagen
 * por defecto, en lugar de mostrar el ícono de imagen rota.
 * Uso: <img [src]="usuario.imagen" appImagenFallback />
 *      <img [src]="url" appImagenFallback="assets/otra.svg" />
 */
@Directive({
  selector: 'img[appImagenFallback]',
  standalone: true
})
export class ImagenFallbackDirective {
  private el = inject<ElementRef<HTMLImageElement>>(ElementRef);

  /** Imagen de reemplazo (opcional). */
  appImagenFallback = input<string>('');

  @HostListener('error')
  alFallar(): void {
    const reemplazo = this.appImagenFallback() || AVATAR_POR_DEFECTO;
    const img = this.el.nativeElement;
    // Evita un bucle infinito si la imagen de reemplazo también fallara
    if (!img.src.endsWith(reemplazo)) {
      img.src = reemplazo;
    }
  }
}
