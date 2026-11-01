// Importamos la interfaz del autor de la publicación
import { IUsuario } from './auth.interface';

/**
 * Interfaz que representa una publicación en el feed de la comunidad.
 */
export interface IPublicacion {
  // Identificador único de la publicación en MongoDB
  _id: string;
  // Objeto con los datos públicos del autor (nombre, usuario, foto)
  usuario: IUsuario;
  // Título del apunte o publicación (hasta 100 caracteres)
  titulo: string;
  // Contenido o cuerpo principal de la publicación (hasta 500 caracteres)
  descripcion: string;
  // URL segura de la imagen adjunta en Cloudinary (opcional)
  imagenUrl?: string;
  // Lista de identificadores de usuarios que dieron me gusta
  meGustas: string[];
  // Contador reactivo de cantidad de me gusta
  cantidadMeGustas: number;
  // Lista de identificadores de comentarios asociados
  comentarios: string[];
  // Contador reactivo de comentarios recibidos
  cantidadComentarios: number;
  // Estado de visibilidad para baja lógica
  activo: boolean;
  // Fecha de creación del post
  createdAt: string;
  // Fecha de última modificación
  updatedAt: string;
}

/**
 * Interfaz para la respuesta paginada del feed enviada por el backend.
 */
export interface IRespuestaPublicaciones {
  // Arreglo con las publicaciones obtenidas
  publicaciones: IPublicacion[];
  // Total de publicaciones existentes para control de paginación
  total?: number;
}
