import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe propio: edad (Sprint 4).
 * Calcula la edad a partir de la fecha de nacimiento: "1998-05-20" → "27 años".
 * Usa la fecha en UTC para que no se corra un día por la zona horaria.
 * Uso: {{ usuario.fechaNacimiento | edad }}
 */
@Pipe({ name: 'edad', standalone: true })
export class EdadPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const nacimiento = new Date(valor);
    if (isNaN(nacimiento.getTime())) return '';

    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getUTCFullYear();
    const mes = hoy.getMonth() - nacimiento.getUTCMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getUTCDate())) edad--;

    return `${edad} ${edad === 1 ? 'año' : 'años'}`;
  }
}
