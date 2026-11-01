// Importamos los decoradores de Mongoose para NestJS
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// Importamos Document y Types para referencias entre colecciones
import { Document, Types } from 'mongoose';
// Importamos la entidad de Usuario para la relación de autoría
import { Usuario } from '../../usuarios/schemas/usuario.schema.js';

// Definimos el tipo compuesto para documentos de Mongoose
export type PublicacionDocument = Publicacion & Document;

/**
 * Esquema representativo de la colección 'publicacions' en MongoDB.
 * timestamps: true genera automáticamente los campos createdAt y updatedAt.
 */
@Schema({ timestamps: true })
export class Publicacion {
  // Referencia al ID del usuario creador (relación ObjectId hacia la colección usuarios)
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  usuario!: Usuario | Types.ObjectId;

  // Título de la publicación o apunte (obligatorio, de 1 a 100 caracteres)
  @Prop({ required: true, minlength: 1, maxlength: 100 })
  titulo!: string;

  // Contenido explicativo o cuerpo del post (obligatorio, de 1 a 500 caracteres)
  @Prop({ required: true, minlength: 1, maxlength: 500 })
  descripcion!: string;

  // Enlace seguro de la imagen adjunta en Cloudinary (opcional)
  @Prop({ required: false })
  imagenUrl?: string;

  // Arreglo de IDs de usuarios que le dieron Me Gusta a la publicación
  @Prop({ type: [{ type: Types.ObjectId, ref: Usuario.name }], default: [] })
  meGustas!: Types.ObjectId[];

  // Contador numérico sincronizado de Me Gustas para consultas y orden rápido
  @Prop({ default: 0 })
  cantidadMeGustas!: number;

  // Arreglo de IDs de comentarios asociados a este post
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comentario' }], default: [] })
  comentarios!: Types.ObjectId[];

  // Contador numérico sincronizado del total de comentarios
  @Prop({ default: 0 })
  cantidadComentarios!: number;

  // Estado de visibilidad para baja lógica (true = visible, false = eliminada)
  @Prop({ default: true })
  activo!: boolean;
}

// Compilamos el esquema Mongoose a partir de la clase decorada
export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);