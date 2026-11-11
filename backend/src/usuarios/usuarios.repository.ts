import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

@Injectable()
export class UsuariosRepository {
  constructor(
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  /**
   * Crea un usuario.
   * Qué hace: Persiste un nuevo documento en la colección usuarios.
   * Cómo lo hace: Instancia el modelo y ejecuta save().
   */
  async create(datos: any): Promise<UsuarioDocument> {
    const nuevoUsuario = new this.usuarioModel(datos);
    return nuevoUsuario.save();
  }

  /**
   * Busca un usuario por ID.
   * Qué hace: Recupera el usuario sin la contraseña.
   * Cómo lo hace: findById(); el hash queda excluido por select: false en el schema.
   */
  async findById(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findById(id).exec();
  }

  /**
   * Busca un usuario por ID incluyendo el hash de la contraseña.
   * Qué hace: Se usa solo para validar la contraseña actual al cambiarla.
   * Cómo lo hace: findById().select('+password').
   */
  async findByIdConPassword(id: string): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findById(id).select('+password').exec();
  }

  /**
   * Busca por correo o nombre de usuario.
   * Qué hace: Sirve para el login (una credencial) y para validar unicidad (ambos campos).
   * Cómo lo hace: Consulta $or en minúsculas e incluye el hash de la contraseña.
   */
  async findByCorreoONombreUsuario(correo: string, nombreUsuario?: string): Promise<UsuarioDocument | null> {
    const query = nombreUsuario
      ? { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: nombreUsuario.toLowerCase() }] }
      : { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: correo.toLowerCase() }] };

    return this.usuarioModel.findOne(query).select('+password').exec();
  }

  /**
   * Busca otro usuario (distinto de idExcluido) que ya use ese correo o nombre de usuario.
   * Qué hace: Valida unicidad al editar el perfil.
   * Cómo lo hace: $or por los campos recibidos y _id distinto ($ne) del usuario que edita.
   */
  async buscarDuplicado(idExcluido: string, correo?: string, nombreUsuario?: string) {
    const condiciones: any[] = [];
    if (correo) condiciones.push({ correo: correo.toLowerCase() });
    if (nombreUsuario) condiciones.push({ nombreUsuario: nombreUsuario.toLowerCase() });
    if (condiciones.length === 0) return null;

    return this.usuarioModel.findOne({ _id: { $ne: idExcluido }, $or: condiciones }).exec();
  }

  /**
   * Lista usuarios para el dashboard (Sprint 4).
   * Qué hace: Devuelve todos los usuarios, filtrando por texto y estado.
   * Cómo lo hace: Arma un filtro con regex insensible a mayúsculas y ordena por fecha de alta.
   */
  async listar(busqueda?: string, estado: string = 'todos'): Promise<UsuarioDocument[]> {
    const filtro: any = {};
    if (estado === 'activos') filtro.activo = true;
    if (estado === 'inactivos') filtro.activo = false;

    if (busqueda && busqueda.trim()) {
      const texto = busqueda.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(texto, 'i');
      filtro.$or = [{ nombre: regex }, { apellido: regex }, { correo: regex }, { nombreUsuario: regex }];
    }

    return this.usuarioModel.find(filtro).sort({ createdAt: -1 }).exec();
  }

  /**
   * Actualiza campos de un usuario.
   * Qué hace: Aplica los cambios recibidos y devuelve el documento actualizado.
   * Cómo lo hace: findByIdAndUpdate con returnDocument 'after' y validadores del schema.
   */
  async actualizar(id: string, cambios: any): Promise<UsuarioDocument | null> {
    return this.usuarioModel
      .findByIdAndUpdate(id, cambios, { returnDocument: 'after', runValidators: true })
      .exec();
  }
}



















// // Importamos el decorador Injectable
// import { Injectable } from '@nestjs/common';
// // Importamos el decorador InjectModel de NestJS Mongoose
// import { InjectModel } from '@nestjs/mongoose';
// // Importamos Model de Mongoose
// import { Model } from 'mongoose';
// // Importamos la clase y el tipo de documento del esquema
// import { Usuario, UsuarioDocument } from './schemas/usuario.schema.js';

// /**
//  * Capa de acceso a datos para la colección de usuarios en MongoDB.
//  */
// @Injectable()
// export class UsuariosRepository {
//   // Inyectamos el modelo de Mongoose
//   constructor(
//     @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
//   ) {}

//   // Inserta un nuevo documento en la base de datos
//   async create(datos: any): Promise<UsuarioDocument> {
//     const nuevoUsuario = new this.usuarioModel(datos);
//     return nuevoUsuario.save();
//   }

//   // Lista todos los usuarios ordenados por fecha descendente
//   async findAll(): Promise<UsuarioDocument[]> {
//     return this.usuarioModel.find().sort({ createdAt: -1 }).exec();
//   }

//   // Busca un usuario por su identificador único _id
//   async findById(id: string): Promise<UsuarioDocument | null> {
//     return this.usuarioModel.findById(id).exec();
//   }

//   // Busca un usuario por correo o nombre de usuario e incluye el campo protegido password
//   async findByCorreoONombreUsuario(correo: string, nombreUsuario?: string): Promise<UsuarioDocument | null> {
//     const query = nombreUsuario
//       ? { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: nombreUsuario.toLowerCase() }] }
//       : { $or: [{ correo: correo.toLowerCase() }, { nombreUsuario: correo.toLowerCase() }] };

//     return this.usuarioModel.findOne(query).select('+password').exec();
//   }

//   // Deshabilita una cuenta de usuario (baja lógica: activo = false)
//   async deshabilitar(id: string): Promise<UsuarioDocument | null> {
//     return this.usuarioModel
//       .findByIdAndUpdate(id, { activo: false }, { returnDocument: 'after' })
//       .exec();
//   }

//   // Rehabilita una cuenta deshabilitada (alta lógica: activo = true)
//   async restaurar(id: string): Promise<UsuarioDocument | null> {
//     return this.usuarioModel
//       .findByIdAndUpdate(id, { activo: true }, { returnDocument: 'after' })
//       .exec();
//   }
// }