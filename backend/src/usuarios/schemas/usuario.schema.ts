import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum RolUsuario {
  USER = 'usuario',
  ADMIN = 'administrador',
}

export type UsuarioDocument = Usuario & Document;

/**
 * Esquema de Mongoose para la colección 'usuarios'.
 * Qué hace: Modela y aplica restricciones a los datos de los usuarios en MongoDB.
 * Cómo lo hace: Emplea decoradores de @nestjs/mongoose para tipar y configurar índices únicos,
 * campos obligatorios y valores por defecto (timestamps crea automáticamente createdAt y updatedAt).
 */
@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, trim: true })
  apellido!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  correo!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  nombreUsuario!: string;

  // select: false evita que el hash de la contraseña viaje en consultas normales
  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true })
  fechaNacimiento!: Date;

  @Prop({ default: '' })
  descripcion!: string;

  // URL de la foto de perfil (Cloudinary). Vacía = el front muestra el avatar por defecto
  @Prop({ default: '' })
  imagen!: string;

  // Por defecto 'usuario', pero puede ser 'administrador' al registrarse
  @Prop({ enum: RolUsuario, default: RolUsuario.USER })
  perfil!: RolUsuario;

  // Bandera de baja lógica (true = habilitado)
  @Prop({ default: true })
  activo!: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);






















// // Importamos decoradores de Mongoose para NestJS
// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// // Importamos los tipos Document y Types de Mongoose
// import { Document } from 'mongoose';

// /**
//  * Enumeración con los roles válidos exigidos por la consigna.
//  */
// export enum RolUsuario {
//   USER = 'usuario',
//   ADMIN = 'administrador',
// }

// // Tipo compuesto para documentos de Mongoose
// export type UsuarioDocument = Usuario & Document;

// /**
//  * Esquema representativo de la colección 'usuarios' en MongoDB.
//  */
// @Schema({ timestamps: true })
// export class Usuario {
//   // Nombre real de la persona
//   @Prop({ required: true, trim: true })
//   nombre!: string;

//   // Apellido real de la persona
//   @Prop({ required: true, trim: true })
//   apellido!: string;

//   // Correo electrónico único e indexado
//   @Prop({ required: true, unique: true, lowercase: true, trim: true })
//   correo!: string;

//   // Alias de usuario único e indexado
//   @Prop({ required: true, unique: true, lowercase: true, trim: true })
//   nombreUsuario!: string;

//   // Contraseña encriptada (oculta en consultas regulares mediante select: false)
//   @Prop({ required: true, select: false })
//   password!: string;

//   // Fecha de nacimiento
//   @Prop({ required: true })
//   fechaNacimiento!: Date;

//   // Breve biografía o presentación
//   @Prop({ default: '' })
//   descripcion!: string;

//   // URL de la imagen de perfil alojada en Cloudinary
//   @Prop({ required: true })
//   imagen!: string;

//   // Perfil de privilegios: 'usuario' por defecto, modificable a 'administrador'
//   @Prop({ enum: RolUsuario, default: RolUsuario.USER })
//   perfil!: RolUsuario;

//   // Estado de la cuenta para baja y alta lógica
//   @Prop({ default: true })
//   activo!: boolean;
// }

// // Generamos el esquema de Mongoose a partir de la clase decorada
// export const UsuarioSchema = SchemaFactory.createForClass(Usuario);