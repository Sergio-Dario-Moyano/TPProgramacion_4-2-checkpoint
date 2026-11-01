// Importamos decoradores e interfaces para pipes de Angular
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizada que transforma cadenas o instancias de fecha en formatos legibles
 * respetando la localización en español de Argentina (es-AR).
 */
@Pipe({
  name: 'formatearFecha',
  standalone: true
})
export class FormatearFechaPipe implements PipeTransform {
  /**
   * Transforma una fecha de entrada según el modo seleccionado.
   */
  transform(
    fecha: Date | string | null | undefined,
    modo: 'completo' | 'corto' | 'conHora' | 'mesAño' = 'completo'
  ): string {
    // Si no se recibe una fecha válida, retornamos un valor seguro
    if (!fecha) return 'N/A';

    // Parseamos la fecha garantizando que sea una instancia de Date
    const date = fecha instanceof Date ? fecha : new Date(fecha);

    // Verificamos si la fecha no es válida
    if (isNaN(date.getTime())) return 'Fecha inválida';

    // Evaluamos el modo de formateo solicitado
    switch (modo) {
      // Modo corto: DD/MM/AAAA
      case 'corto':
        return date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

      // Modo con hora: DD/MM/AAAA, HH:mm
      case 'conHora':
        return date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

      // Modo mes y año: Mes de AAAA
      case 'mesAño':
        return date.toLocaleString('es-AR', {
          month: 'long',
          year: 'numeric'
        });

      // Modo completo por defecto: DD de mes de AAAA
      case 'completo':
      default:
        return date.toLocaleString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  }
}
