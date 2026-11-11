import { Directive, HostListener, output, signal } from '@angular/core';

/**
 * Directiva propia: appSoltarArchivo.
 * Convierte cualquier elemento en una zona para arrastrar y soltar una imagen.
 * Mientras se arrastra un archivo encima, agrega la clase "arrastrando" (estilo global en styles.css)
 * y al soltarlo emite el archivo. La validación (tipo y tamaño) la hace el componente que la usa,
 * igual que cuando el archivo se elige con el botón.
 * Uso: <div appSoltarArchivo (archivoSoltado)="cargarImagen($event)">...</div>
 */
@Directive({
  selector: '[appSoltarArchivo]',
  standalone: true,
  host: { '[class.arrastrando]': 'arrastrando()' }
})
export class SoltarArchivoDirective {
  archivoSoltado = output<File>();
  arrastrando = signal(false);

  /** dragenter/dragleave se disparan también al pasar por los hijos: se cuentan para no parpadear. */
  private contador = 0;

  private traeArchivos(evento: DragEvent): boolean {
    return Array.from(evento.dataTransfer?.types ?? []).includes('Files');
  }

  @HostListener('dragenter', ['$event'])
  alEntrar(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;
    evento.preventDefault();
    this.contador++;
    this.arrastrando.set(true);
  }

  @HostListener('dragover', ['$event'])
  alPasar(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;
    evento.preventDefault(); // necesario para que el navegador permita soltar
    if (evento.dataTransfer) evento.dataTransfer.dropEffect = 'copy';
  }

  @HostListener('dragleave')
  alSalir(): void {
    this.contador = Math.max(0, this.contador - 1);
    if (this.contador === 0) this.arrastrando.set(false);
  }

  @HostListener('drop', ['$event'])
  alSoltar(evento: DragEvent): void {
    if (!this.traeArchivos(evento)) return;
    evento.preventDefault();
    evento.stopPropagation();
    this.contador = 0;
    this.arrastrando.set(false);

    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) this.archivoSoltado.emit(archivo);
  }
}
