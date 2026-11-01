// Importamos Injectable y excepciones HTTP de NestJS
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
// Importamos el repositorio de publicaciones
import { PublicacionesRepository } from './publicaciones.repository.js';
// Importamos los DTOs
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';
// Importamos el servicio de Cloudinary para subida multimedia
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
// Importamos el servicio de usuarios para verificar roles y autorías
import { UsuariosService } from '../usuarios/usuarios.service.js';
// Importamos el enum de roles
import { RolUsuario } from '../usuarios/schemas/usuario.schema.js';

/**
 * Servicio encargado de la lógica de negocio para el ciclo de vida de publicaciones.
 */
@Injectable()
export class PublicacionesService {
  constructor(
    private readonly publicacionesRepository: PublicacionesRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * Crea una nueva publicación subiendo opcionalmente la imagen a Cloudinary en la carpeta 'publicaciones'.
   */
  async crear(createDto: CreatePublicacionDto, usuarioId: string, file?: Express.Multer.File) {
    let imagenUrl: string | undefined = undefined;

    // Si se adjunta un archivo, lo subimos en streaming a Cloudinary
    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'publicaciones');
      imagenUrl = upload?.secure_url;
    }

    // Armamos el payload relacionando el usuario extraído del JWT en la cookie
    const payload = {
      usuario: usuarioId,
      titulo: createDto.titulo,
      descripcion: createDto.descripcion,
      imagenUrl,
    };

    return this.publicacionesRepository.crear(payload);
  }

  /**
   * Lista publicaciones activas mediante el repositorio.
   */
  async listar(queryDto: QueryPublicacionDto) {
    return this.publicacionesRepository.listar(queryDto);
  }

  /**
   * Da de baja lógica una publicación validando que quien ejecuta la acción sea el autor o un administrador.
   */
  async darDeBaja(id: string, usuarioId: string) {
    const publicacion = await this.publicacionesRepository.buscarPorId(id);

    // Si no existe la publicación, lanzamos error 404
    if (!publicacion) {
      throw new NotFoundException('Publicación no encontrada');
    }

    // Buscamos el usuario solicitante para corroborar su rol
    const usuarioQueBorra = await this.usuariosService.findOne(usuarioId);

    if (!usuarioQueBorra) {
      throw new UnauthorizedException('Usuario inexistente o no válido');
    }

    // Comprobamos si el usuario no es el creador del post y tampoco es admin
    const idAutor = (publicacion.usuario as any)?._id?.toString() || publicacion.usuario.toString();
    if (idAutor !== usuarioId && usuarioQueBorra.perfil !== RolUsuario.ADMIN) {
      throw new UnauthorizedException('No tenés permiso para eliminar esta publicación');
    }

    // Ejecutamos la baja lógica
    return this.publicacionesRepository.darDeBaja(id);
  }

  /**
   * Registra un Me Gusta sobre una publicación activa.
   */
  async darMeGusta(id: string, usuarioId: string) {
    const publicacion = await this.publicacionesRepository.darMeGusta(id, usuarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Elimina un Me Gusta registrado previamente.
   */
  async quitarMeGusta(id: string, usuarioId: string) {
    const publicacion = await this.publicacionesRepository.quitarMeGusta(id, usuarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Vincula un nuevo comentario a la publicación e incrementa su contador.
   */
  async agregarComentario(publicacionId: string, comentarioId: string) {
    const publicacion = await this.publicacionesRepository.agregarComentario(publicacionId, comentarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Desvincula un comentario y decrementa su contador.
   */
  async eliminarComentario(publicacionId: string, comentarioId: string) {
    const publicacion = await this.publicacionesRepository.eliminarComentario(publicacionId, comentarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Recupera una publicación específica por su ID.
   */
  async buscarPorId(id: string) {
    const publicacion = await this.publicacionesRepository.buscarPorId(id);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Genera estadísticas de publicaciones por usuario en el lapso de días especificado.
   */
  async obtenerEstadisticasUsuarios(dias?: number) {
    const fechaInicio = new Date();
    // Por defecto toma los últimos 30 días si no se especifica el rango
    fechaInicio.setDate(fechaInicio.getDate() - (dias || 30));
    return this.publicacionesRepository.statsPublicacionesPorUsuario(fechaInicio);
  }
}