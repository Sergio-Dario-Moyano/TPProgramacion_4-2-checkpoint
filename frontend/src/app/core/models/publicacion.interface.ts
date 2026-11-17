import { IUsuario } from './auth.interface';

export type CategoriaPublicacion =
  | 'general'
  | 'resena'
  | 'guia'
  | 'clip'
  | 'pregunta'
  | 'noticia'
  | 'busco-equipo';

/** Categorías disponibles con su texto para mostrar. */
export const CATEGORIAS: { valor: CategoriaPublicacion; etiqueta: string }[] = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'resena', etiqueta: 'Reseña' },
  { valor: 'guia', etiqueta: 'Guía / Tip' },
  { valor: 'clip', etiqueta: 'Clip / Captura' },
  { valor: 'pregunta', etiqueta: 'Pregunta' },
  { valor: 'noticia', etiqueta: 'Noticia' },
  { valor: 'busco-equipo', etiqueta: 'Busco equipo' }
];

export interface IPublicacion {
  _id: string;
  usuario: IUsuario;
  titulo: string;
  descripcion: string;
  categoria: CategoriaPublicacion;
  juego: string;
  modificado: boolean;
  imagenUrl?: string;
  meGustas: string[];
  cantidadMeGustas: number;
  comentarios: string[];
  cantidadComentarios: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IRespuestaPublicaciones {
  publicaciones: IPublicacion[];
  total: number;
}















