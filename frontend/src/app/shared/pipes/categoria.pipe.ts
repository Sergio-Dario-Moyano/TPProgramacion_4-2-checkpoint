import { Pipe, PipeTransform } from '@angular/core';
import { CATEGORIAS } from '../../core/models/publicacion.interface';

/**
 * Pipe propio: categoria (Sprint 4).
 * Traduce el valor guardado de la categoría a su texto: "resena" → "Reseña", "busco-equipo" → "Busco equipo".
 * Uso: {{ publicacion.categoria | categoria }}
 */
@Pipe({ name: 'categoria', standalone: true })
export class CategoriaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? 'General';
  }
}
