import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsuariosRepository } from './usuarios.repository.js';
import { RolUsuario, UsuarioDocument } from './schemas/usuario.schema.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Quita datos sensibles antes de responder.
   * Qué hace: Elimina el hash de la contraseña del objeto usuario.
   * Cómo lo hace: Convierte el documento a objeto plano y borra la propiedad password.
   */
  sanitizarUsuario(usuario: any) {
    const obj = usuario.toObject ? usuario.toObject() : { ...usuario };
    delete obj.password;
    return obj;
  }

  /**
   * Sube una foto de perfil a Cloudinary.
   * Qué hace: Devuelve la URL segura de la imagen o la imagen por defecto si no se envió archivo.
   * Cómo lo hace: Usa CloudinaryService con la carpeta 'fotos_perfil'.
   */
  async subirFotoPerfil(file?: Express.Multer.File): Promise<string> {
    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'fotos_perfil');
      return upload?.secure_url ?? '';
    }
    return this.configService.get<string>('DEFAULT_PROFILE_IMAGE_URL') ?? '';
  }

  /**
   * Crea un usuario nuevo (registro público y alta desde el dashboard).
   * Qué hace: Valida que correo y nombre de usuario sean únicos, que las contraseñas coincidan,
   * encripta la contraseña y guarda el usuario.
   * Cómo lo hace: bcrypt con 10 rondas de salt; el perfil por defecto es 'usuario'.
   */
  async crearUsuario(dto: CreateUsuarioDto, file?: Express.Multer.File) {
    const { repetirPassword, password, perfil, ...datosUsuario } = dto;

    if (repetirPassword !== undefined && repetirPassword !== password) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const existente = await this.usuariosRepository.findByCorreoONombreUsuario(
      dto.correo,
      dto.nombreUsuario,
    );
    if (existente) {
      const campo =
        existente.correo === dto.correo.toLowerCase() ? 'correo' : 'nombre de usuario';
      throw new ConflictException(`Ese ${campo} ya está registrado`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const imagen = await this.subirFotoPerfil(file);

    const usuario = await this.usuariosRepository.create({
      ...datosUsuario,
      password: hashedPassword,
      imagen,
      perfil: perfil || RolUsuario.USER,
      activo: true,
    });

    return this.sanitizarUsuario(usuario);
  }

  async findOne(id: string): Promise<UsuarioDocument | null> {
    return this.usuariosRepository.findById(id);
  }

  async findByCorreoONombreUsuario(correo: string, nombreUsuario?: string): Promise<UsuarioDocument | null> {
    return this.usuariosRepository.findByCorreoONombreUsuario(correo, nombreUsuario);
  }

  /**
   * Edita el perfil del usuario logueado.
   * Qué hace: Actualiza solo los campos enviados, valida unicidad de correo y nombre de usuario,
   * y reemplaza o quita la foto de perfil.
   * Cómo lo hace: buscarDuplicado() excluyendo al propio usuario (409 si ya existe),
   * sube la imagen nueva a Cloudinary si llega archivo y guarda con findByIdAndUpdate.
   */
  async actualizarPerfil(id: string, dto: UpdatePerfilDto, file?: Express.Multer.File) {
    const usuario = await this.usuariosRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const { quitarImagen, ...campos } = dto;
    const cambios: any = {};
    for (const [clave, valor] of Object.entries(campos)) {
      if (valor !== undefined) cambios[clave] = typeof valor === 'string' ? valor.trim() : valor;
    }

    if (cambios.correo) cambios.correo = cambios.correo.toLowerCase();
    if (cambios.nombreUsuario) cambios.nombreUsuario = cambios.nombreUsuario.toLowerCase();

    const duplicado = await this.usuariosRepository.buscarDuplicado(
      id,
      cambios.correo,
      cambios.nombreUsuario,
    );
    if (duplicado) {
      const campo = duplicado.correo === cambios.correo ? 'correo' : 'nombre de usuario';
      throw new ConflictException(`Ese ${campo} ya lo usa otro jugador`);
    }

    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'fotos_perfil');
      cambios.imagen = upload?.secure_url ?? usuario.imagen;
    } else if (quitarImagen === 'true') {
      cambios.imagen = this.configService.get<string>('DEFAULT_PROFILE_IMAGE_URL') ?? '';
    }

    if (Object.keys(cambios).length === 0) {
      throw new BadRequestException('No enviaste ningún cambio');
    }

    const actualizado = await this.usuariosRepository.actualizar(id, cambios);
    return this.sanitizarUsuario(actualizado);
  }

  /**
   * Cambia la contraseña del usuario logueado.
   * Qué hace: Verifica la contraseña actual y guarda la nueva encriptada.
   * Cómo lo hace: bcrypt.compare contra el hash guardado (400 si no coincide) y bcrypt.hash para la nueva.
   */
  async cambiarPassword(id: string, dto: CambiarPasswordDto) {
    if (dto.passwordNueva !== dto.repetirPassword) {
      throw new BadRequestException('Las contraseñas nuevas no coinciden');
    }

    const usuario = await this.usuariosRepository.findByIdConPassword(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const valida = await bcrypt.compare(dto.passwordActual, usuario.password);
    // 400 y no 401: el usuario sí está autenticado, lo que está mal es el dato enviado
    if (!valida) throw new BadRequestException('La contraseña actual es incorrecta');

    const hash = await bcrypt.hash(dto.passwordNueva, await bcrypt.genSalt(10));
    await this.usuariosRepository.actualizar(id, { password: hash });
  }

  /**
   * Lista usuarios para el dashboard (Sprint 4).
   * Qué hace: Devuelve los usuarios sanitizados y el total.
   * Cómo lo hace: Delegación en el repositorio con los filtros recibidos.
   */
  async listar(busqueda?: string, estado?: string) {
    const usuarios = await this.usuariosRepository.listar(busqueda, estado);
    return { usuarios: usuarios.map((u) => this.sanitizarUsuario(u)), total: usuarios.length };
  }

  /**
   * Baja / alta lógica de un usuario (Sprint 4).
   * Qué hace: Cambia el estado activo de la cuenta. Un administrador no puede deshabilitarse a sí mismo.
   * Cómo lo hace: Busca el usuario (404 si no existe), valida el estado actual (409 si no cambia nada)
   * y actualiza activo.
   */
  async cambiarEstado(id: string, activo: boolean, idAdmin: string) {
    if (!activo && id === idAdmin) {
      throw new BadRequestException('No podés deshabilitar tu propia cuenta');
    }

    const usuario = await this.usuariosRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    if (usuario.activo === activo) {
      throw new ConflictException(
        activo ? 'El usuario ya está habilitado' : 'El usuario ya está deshabilitado',
      );
    }

    const actualizado = await this.usuariosRepository.actualizar(id, { activo });
    return this.sanitizarUsuario(actualizado);
  }

  /**
   * Cambia el rol de un usuario existente (Sprint 4).
   * Qué hace: Convierte un usuario en administrador o al revés. Un administrador no puede
   * quitarse el rol a sí mismo (así nunca se queda la app sin administradores por error).
   * Cómo lo hace: 400 si intenta cambiar su propio rol, 404 si no existe, 409 si está deshabilitado
   * o si ya tiene ese rol.
   */
  async cambiarRol(id: string, perfil: RolUsuario, idAdmin: string) {
    if (id === idAdmin) {
      throw new BadRequestException('No podés cambiar tu propio rol');
    }

    const usuario = await this.usuariosRepository.findById(id);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Un usuario deshabilitado no puede cambiar de rol: primero hay que habilitarlo
    if (!usuario.activo) {
      throw new ConflictException(
        'No se puede cambiar el rol de un usuario deshabilitado. Habilitalo primero.',
      );
    }

    if (usuario.perfil === perfil) {
      throw new ConflictException(`El usuario ya tiene el perfil "${perfil}"`);
    }

    const actualizado = await this.usuariosRepository.actualizar(id, { perfil });
    return this.sanitizarUsuario(actualizado);
  }
}
