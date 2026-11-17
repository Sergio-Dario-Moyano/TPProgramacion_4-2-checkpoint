import { IUsuario } from './auth.interface';

/**
 * Interfaz que modela un comentario asociado a una publicación.
 */
export interface IComentario {
  _id: string;
  usuario: IUsuario;
  publicacion: string;
  texto: string;
  modificado: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IRespuestaComentarios {
  comentarios: IComentario[];
  total: number;
}














