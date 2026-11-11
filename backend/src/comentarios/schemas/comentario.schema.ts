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



















// // Importamos decoradores de esquemas de Mongoose para NestJS
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// // Importamos Document y Types para referencias entre colecciones
// import { Document, Types } from 'mongoose';
// // Importamos los esquemas relacionados de Usuario y Publicacion
// import { Usuario } from '../../usuarios/schemas/usuario.schema.js';
// import { Publicacion } from '../../publicaciones/schemas/publicacion.schema.js';

// // Tipo compuesto para documentos de Mongoose
// export type ComentarioDocument = Comentario & Document;

// /**
//  * Esquema de la colección 'comentarios' en MongoDB.
//  * timestamps: true genera y administra automáticamente los campos createdAt y updatedAt.
//  */
// @Schema({ timestamps: true })
// export class Comentario {
//   // Referencia al ID del autor del comentario en la colección usuarios
//   @Prop({ type: Types.ObjectId, ref: Usuario.name, required: true })
//   usuario!: Usuario | Types.ObjectId;

//   // Referencia a la publicación a la que pertenece este comentario
//   @Prop({ type: Types.ObjectId, ref: Publicacion.name, required: true })
//   publicacion!: Publicacion | Types.ObjectId;

//   // Texto del comentario (obligatorio, de 1 a 150 caracteres)
//   @Prop({ required: true, minlength: 1, maxlength: 150 })
//   texto!: string;

//   // Bandera booleana que indica si el comentario fue editado tras su publicación
//   @Prop({ default: false })
//   modificado!: boolean;

//   // Estado para la baja lógica (true = visible, false = dado de baja)
//   @Prop({ default: true })
//   activo!: boolean;
// }

// // Compilamos el esquema Mongoose a partir de la clase decorada
// export const ComentarioSchema = SchemaFactory.createForClass(Comentario);