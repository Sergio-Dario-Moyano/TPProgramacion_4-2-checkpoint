import { IPublicacion } from '../models/publicacion.interface';

/** Indica si el usuario ya le dio me gusta a la publicación. */
export function yaDioMeGusta(publicacion: IPublicacion, usuarioId?: string | null): boolean {
  if (!usuarioId) return false;
  return (publicacion.meGustas || []).some((item: any) => (item?._id ?? item)?.toString() === usuarioId);
}

/**
 * Devuelve una copia de la publicación con el me gusta agregado o quitado.
 * Se usa para actualizar la pantalla sin volver a pedir todo el listado.
 */
export function aplicarMeGusta(publicacion: IPublicacion, usuarioId: string, dar: boolean): IPublicacion {
  const sinUsuario = (publicacion.meGustas || []).filter((item: any) => (item?._id ?? item)?.toString() !== usuarioId);
  const meGustas = dar ? [...sinUsuario, usuarioId] : sinUsuario;
  return { ...publicacion, meGustas, cantidadMeGustas: meGustas.length };
}
