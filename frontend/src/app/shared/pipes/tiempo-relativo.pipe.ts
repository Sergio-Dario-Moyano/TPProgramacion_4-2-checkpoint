import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propio: tiempoRelativo (Sprint 4).
 * Convierte una fecha en un texto relativo: "recién", "hace 5 min", "hace 3 h", "ayer",
 * "hace 4 días". Pasada una semana muestra la fecha (dd/mm/aaaa).
 * Uso: {{ publicacion.createdAt | tiempoRelativo }}
 */
@Pipe({ name: 'tiempoRelativo', standalone: true })
export class TiempoRelativoPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return '';

    const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
    if (segundos < 45) return 'recién';

    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) return `hace ${Math.max(1, minutos)} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ayer';
    if (dias < 7) return `hace ${dias} días`;

    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
