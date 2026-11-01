// Importamos la interfaz PipeTransform y el decorador Pipe
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizada que convierte una marca de tiempo en una distancia relativa
 * dinámica idéntica a la usada en redes sociales modernas ("Hace 5 min", "Hace 2 h").
 */
@Pipe({
  name: 'tiempoRelativo',
  standalone: true
})
export class TiempoRelativoPipe implements PipeTransform {
  /**
   * Calcula la diferencia temporal respecto al instante actual.
   */
  transform(fecha: string | Date | null | undefined): string {
    // Si la fecha es nula o indefinida, devolvemos un texto seguro por defecto
    if (!fecha) return 'Hace un momento';

    // Instanciamos la fecha recibida
    const fechaPost = new Date(fecha);
    // Tomamos la fecha y hora actuales
    const ahora = new Date();

    // Calculamos la diferencia total en segundos
    const diferenciaSegundos = Math.floor((ahora.getTime() - fechaPost.getTime()) / 1000);

    // Menos de 1 segundo de diferencia
    if (diferenciaSegundos < 1) {
      return 'Ahora mismo';
    }

    // Menos de 60 segundos
    if (diferenciaSegundos < 60) {
      return `Hace ${diferenciaSegundos} s`;
    }

    // Menos de 60 minutos
    const diferenciaMinutos = Math.floor(diferenciaSegundos / 60);
    if (diferenciaMinutos < 60) {
      return `Hace ${diferenciaMinutos} min`;
    }

    // Menos de 24 horas
    const diferenciaHoras = Math.floor(diferenciaMinutos / 60);
    if (diferenciaHoras < 24) {
      return `Hace ${diferenciaHoras} h`;
    }

    // Exactamente 1 día
    const diferenciaDias = Math.floor(diferenciaHoras / 24);
    if (diferenciaDias === 1) {
      return 'Hace 1 día';
    }

    // Más de un día
    return `Hace ${diferenciaDias} días`;
  }
}
