import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema.js';

export type PublicacionDocument = Publicacion & Document;

/** Tipos de publicación de la comunidad gamer. */
export const CATEGORIAS_PUBLICACION = ['general', 'resena', 'guia', 'clip', 'pregunta', 'noticia', 'busco-equipo'] as const;
export type CategoriaPublicacion = (typeof CATEGORIAS_PUBLICACION)[number];

/**
 * Esquema representativo de la colección 'publicacions' en MongoDB.
 * Qué hace: Define la estructura, tipos de datos y restricciones para las publicaciones.
 * Cómo lo hace: Utiliza decoradores de @nestjs/mongoose para asociar el usuario creador (Types.ObjectId),
 * restringir longitud de títulos y descripciones, y sincronizar arrays y contadores numéricos.
 */
@Schema({ timestamps: true })
export class Publicacion {
  // Relación con el usuario autor en la colección 'usuarios'
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  usuario!: Usuario | Types.ObjectId;

  // Título obligatorio de 1 a 100 caracteres
  @Prop({ required: true, minlength: 1, maxlength: 100 })
  titulo!: string;

  // Contenido de la publicación de 1 a 500 caracteres
  @Prop({ required: true, minlength: 1, maxlength: 500 })
  descripcion!: string;

  // Tipo de publicación (reseña, guía, clip, etc.)
  @Prop({ enum: CATEGORIAS_PUBLICACION, default: 'general' })
  categoria!: CategoriaPublicacion;

  // Juego del que habla la publicación (opcional)
  @Prop({ default: '', trim: true, maxlength: 60 })
  juego!: string;

  // Marca si la publicación fue editada por su autor
  @Prop({ default: false })
  modificado!: boolean;

  // URL segura de la imagen alojada en Cloudinary (opcional)
  @Prop({ required: false })
  imagenUrl?: string;

  // Array de IDs de usuarios que dieron "Me gusta"
  @Prop({ type: [{ type: Types.ObjectId, ref: Usuario.name }], default: [] })
  meGustas!: Types.ObjectId[];

  // Contador sincronizado para ordenamiento y consultas rápidas
  @Prop({ default: 0 })
  cantidadMeGustas!: number;

  // Array de IDs de comentarios vinculados
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comentario' }], default: [] })
  comentarios!: Types.ObjectId[];

  // Contador sincronizado de comentarios
  @Prop({ default: 0 })
  cantidadComentarios!: number;

  // Bandera de baja lógica (true = visible, false = eliminada)
  @Prop({ default: true })
  activo!: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);




