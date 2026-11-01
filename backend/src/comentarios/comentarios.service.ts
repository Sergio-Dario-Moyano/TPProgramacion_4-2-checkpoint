// Importamos Injectable, excepciones de NestJS e inyecciones diferidas
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
// Importamos el repositorio de comentarios
import { ComentariosRepository } from './comentarios.repository.js';
// Importamos los DTOs de creación y edición
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';
// Importamos el servicio de publicaciones para sincronizar contadores atómicos
import { PublicacionesService } from '../publicaciones/publicaciones.service.js';
// Importamos el servicio de usuarios para validar roles
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { RolUsuario } from '../usuarios/schemas/usuario.schema.js';

/**
 * Servicio encargado de la lógica de negocio y autorizaciones de comentarios.
 */
@Injectable()
export class ComentariosService {
  constructor(
    private readonly comentariosRepository: ComentariosRepository,
    @Inject(forwardRef(() => PublicacionesService))
    private readonly publicacionesService: PublicacionesService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * Crea un comentario y actualiza en un paso atómico la publicación asociada.
   */
  async crear(publicacionId: string, usuarioId: string, createDto: CreateComentarioDto) {
    // Verificamos que la publicación exista y se encuentre activa
    await this.publicacionesService.buscarPorId(publicacionId);

    // Ensamblamos el payload del comentario
    const payload = {
      usuario: usuarioId,
      publicacion: publicacionId,
      texto: createDto.texto,
    };

    // Guardamos el nuevo comentario en MongoDB
    const comentarioCreado = await this.comentariosRepository.crear(payload);

    // Incrementamos el contador atómico en la publicación
    await this.publicacionesService.agregarComentario(
      publicacionId,
      comentarioCreado._id.toString(),
    );

    return comentarioCreado;
  }

  /**
   * Lista los comentarios de una publicación y calcula el total existente.
   */
  async listarPorPublicacion(publicacionId: string, limit: number = 5, offset: number = 0) {
    const comentarios = await this.comentariosRepository.listarPorPublicacion(
      publicacionId,
      limit,
      offset,
    );
    const total = await this.comentariosRepository.contarPorPublicacion(publicacionId);

    return { comentarios, total };
  }

  /**
   * Edita el texto de un comentario propio. Solo permitido al autor original.
   */
  async actualizar(comentarioId: string, usuarioId: string, updateDto: UpdateComentarioDto) {
    const comentario = await this.comentariosRepository.buscarPorId(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    // Comprobamos que quien edita sea exactamente el autor del comentario
    const autorId = (comentario.usuario as any)?._id?.toString() || comentario.usuario.toString();
    if (autorId !== usuarioId) {
      throw new UnauthorizedException('Solo el autor puede editar su comentario');
    }

    return this.comentariosRepository.actualizar(comentarioId, updateDto.texto);
  }

  /**
   * Da de baja lógica un comentario y decrementa el contador en la publicación.
   * Permitido al autor original o a usuarios con perfil de administrador.
   */
  async eliminar(comentarioId: string, usuarioId: string) {
    const comentario = await this.comentariosRepository.buscarPorId(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const usuario = await this.usuariosService.findOne(usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const autorId = (comentario.usuario as any)?._id?.toString() || comentario.usuario.toString();
    const esAdmin = usuario.perfil === RolUsuario.ADMIN;

    // Si no es el autor ni administrador, bloqueamos la acción con 401
    if (autorId !== usuarioId && !esAdmin) {
      throw new UnauthorizedException('No tenés permisos para eliminar este comentario');
    }

    // Aplicamos la baja lógica
    const eliminado = await this.comentariosRepository.darDeBaja(comentarioId);

    // Decrementamos el contador de la publicación
    const publicacionId = (comentario.publicacion as any)?._id?.toString() || comentario.publicacion.toString();
    await this.publicacionesService.eliminarComentario(publicacionId, comentarioId);

    return eliminado;
  }

  /**
   * Genera las métricas de evolución de comentarios en el tiempo para el gráfico de líneas.
   */
  async obtenerEstadisticasTimeline(dias?: number) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - (dias || 7));
    return this.comentariosRepository.statsTimeline(fechaInicio);
  }

  /**
   * Genera las métricas de comentarios por publicación para el gráfico de dona.
   */
  async obtenerEstadisticasPorPublicacion(dias?: number) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - (dias || 7));
    return this.comentariosRepository.statsPorPublicacion(fechaInicio);
  }
}