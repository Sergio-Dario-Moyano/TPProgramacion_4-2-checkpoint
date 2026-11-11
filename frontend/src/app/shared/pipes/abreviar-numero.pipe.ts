import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propio: abreviarNumero (Sprint 4).
 * Abrevia contadores grandes como en las redes: 950 → "950", 1530 → "1,5 k", 2400000 → "2,4 M".
 * Uso: {{ publicacion.cantidadMeGustas | abreviarNumero }}
 */
@Pipe({ name: 'abreviarNumero', standalone: true })
export class AbreviarNumeroPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    const n = Number(valor ?? 0);
    if (!isFinite(n)) return '0';

    const formatear = (x: number) =>
      x.toLocaleString('es-AR', { maximumFractionDigits: x < 10 ? 1 : 0 });

    if (Math.abs(n) >= 1_000_000) return `${formatear(n / 1_000_000)} M`;
    if (Math.abs(n) >= 1_000) return `${formatear(n / 1_000)} k`;
    return String(n);
  }
}
