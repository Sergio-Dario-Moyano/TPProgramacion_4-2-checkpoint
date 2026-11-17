import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Usuario } from '../../usuarios/schemas/usuario.schema.js';
import { Publicacion } from '../../publicaciones/schemas/publicacion.schema.js';

export type ComentarioDocument = Comentario & Document;

/**
 * Esquema de Mongoose para la colección 'comentarios'.
 * Qué hace: Modela los comentarios hechos en publicaciones con autoría y estado de edición.
 * Cómo lo hace: Usa referencias Types.ObjectId hacia Usuario y Publicacion, aplica límites de texto (150 chars)
 * y gestiona los booleanos 'modificado' (Sprint 3) y 'activo' para baja lógica.
 */
@Schema({ timestamps: true })
export class Comentario {
  @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
  usuario!: Usuario | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Publicacion.name, required: true })
  publicacion!: Publicacion | Types.ObjectId;

  // Límite de 150 caracteres para comentarios
  @Prop({ required: true, minlength: 1, maxlength: 150 })
  texto!: string;

  // Marca  si el comentario fue editado
  @Prop({ default: false })
  modificado!: boolean;

  // Bandera de baja lógica
  @Prop({ default: true })
  activo!: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);










