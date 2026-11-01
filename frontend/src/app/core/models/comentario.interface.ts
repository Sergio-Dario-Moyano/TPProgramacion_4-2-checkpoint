// Importamos la interfaz del usuario que comenta
import { IUsuario } from './auth.interface';

/**
 * Interfaz que define un comentario en una publicación.
 */
export interface IComentario {
  // Identificador único del comentario en MongoDB
  _id: string;
  // Autor del comentario con sus datos básicos
  usuario: IUsuario;
  // Identificador de la publicación asociada
  publicacion: string;
  // Texto del comentario (máximo 150 caracteres)
  texto: string;
  // Indica si el comentario fue editado por su autor
  modificado: boolean;
  // Bandera de baja lógica
  activo: boolean;
  // Fecha de publicación
  createdAt: string;
  // Fecha de edición
  updatedAt: string;
}

/**
 * Interfaz para la respuesta paginada de comentarios de un post.
 */
export interface IRespuestaComentarios {
  // Lista de comentarios cargados
  comentarios: IComentario[];
  // Total de comentarios del post para gestionar el botón de cargar más
  total: number;
}
