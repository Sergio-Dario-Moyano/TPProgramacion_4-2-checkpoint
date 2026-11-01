// Importamos el decorador Injectable
import { Injectable } from '@nestjs/common';
// Importamos el decorador InjectModel de NestJS Mongoose
import { InjectModel } from '@nestjs/mongoose';
// Importamos Model de Mongoose
import { Model } from 'mongoose';
// Importamos la clase y el tipo de documento del esquema
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

/**
 * Capa de acceso a datos para la colección de usuarios en MongoDB.
 */
@Injectable()
export class UsuariosRepository {
  // Inyectamos el modelo de Mongoose
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
  ) {}

  // Inserta un nuevo documento en la base de datos
  async create(datos: any): Promise<UsuarioDocument> {
    const nuevoUsuario = new this.usuarioModel(datos);
    return nuevoUsuario.save();
  }

  // Lista todos los usuarios ordenados por fecha descendente
  async findAll(): Promise<UsuarioDocument[]> {
    return this.usuarioModel.find().sort({ createdAt: -1 }).exec();
  }

  // Busca un usuario por su identificador único _id
  async findById(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findById(id).exec();
  }

  // Busca un usuario por correo o nombre de usuario e incluye el campo protegido password
  async findByCorreoONombreUsuario(correo: string, nombreUsuario?: string): Promise<UsuarioDocument | null> {
    const query = nombreUsuario
      ? { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: nombreUsuario.toLowerCase() }] }
      : { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: correo.toLowerCase() }] };

    return this.usuarioModel.findOne(query).select('+password').exec();
  }

  // Deshabilita una cuenta de usuario (baja lógica: activo = false)
  async deshabilitar(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel
      .findByIdAndUpdate(id, { activo: false }, { returnDocument: 'after' })
      .exec();
  }

  // Rehabilita una cuenta deshabilitada (alta lógica: activo = true)
  async restaurar(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel
      .findByIdAndUpdate(id, { activo: true }, { returnDocument: 'after' })
      .exec();
  }
}