// Importamos Injectable y excepciones de NestJS
import { Injectable, NotFoundException } from '@nestjs/common';
// Importamos el repositorio de usuarios
import { UsuariosRepository } from './usuarios.repository.js';
// Importamos el DTO de creación
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
// Importamos bcrypt para hashing de contraseñas
import * as bcrypt from 'bcrypt';
// Importamos el servicio de Cloudinary para avatares
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio encargado de la lógica de negocio para usuarios.
 */
@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  // Sanitiza un objeto de usuario eliminando el campo password antes de responder
  sanitizarUsuario(usuario: any) {
    const obj = usuario.toObject ? usuario.toObject() : { ...usuario };
    delete obj.password;
    return obj;
  }

  // Registra un nuevo usuario en la base de datos
  async create(datos: any) {
    return this.usuariosRepository.create(datos);
  }

  // Lista todos los usuarios registrados
  async findAll() {
    const usuarios = await this.usuariosRepository.findAll();
    return usuarios.map((u) => this.sanitizarUsuario(u));
  }

  // Busca un usuario por su ID
  async findOne(id: string) {
    return this.usuariosRepository.findById(id);
  }

  // Busca por correo o alias público
  async findByCorreoONombreUsuario(correo: string, nombreUsuario?: string) {
    return this.usuariosRepository.findByCorreoONombreUsuario(correo, nombreUsuario);
  }

  // Alta de un nuevo usuario desde el panel administrativo (con soporte de foto de perfil)
  async crearDesdeAdmin(dto: CreateUsuarioDto, file?: Express.Multer.File) {
    let imagenUrl: string | undefined = undefined;

    // Si se subió un archivo físico, lo transmitimos a Cloudinary
    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'fotos_perfil');
      imagenUrl = upload?.secure_url;
    } else {
      // Usamos la URL por defecto si no se proveyó imagen
      imagenUrl = this.configService.get<string>('DEFAULT_PROFILE_IMAGE_URL');
    }

    // Hasheamos la contraseña con un factor de costo de 10 rondas
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const { repetirPassword, password, ...datosBase } = dto;

    const payload = {
      ...datosBase,
      password: hashedPassword,
      imagen: imagenUrl,
      activo: true,
    };

    const creado = await this.usuariosRepository.create(payload);
    return this.sanitizarUsuario(creado);
  }

  // Ejecuta la baja lógica
  async deshabilitar(id: string) {
    const usuario = await this.usuariosRepository.deshabilitar(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sanitizarUsuario(usuario);
  }

  // Ejecuta el alta lógica
  async restaurar(id: string) {
    const usuario = await this.usuariosRepository.restaurar(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return this.sanitizarUsuario(usuario);
  }
}