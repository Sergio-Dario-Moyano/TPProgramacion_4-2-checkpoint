
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ComentariosRepository } from './comentarios.repository.js';
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';
import { PublicacionesService } from '../publicaciones/publicaciones.service.js';
import { RolUsuario } from '../usuarios/schemas/usuario.schema.js';

@Injectable()
export class ComentariosService {
  constructor(
    private readonly comentariosRepository: ComentariosRepository,
    private readonly publicacionesService: PublicacionesService,
  ) {}

  /**
   * Agrega un nuevo comentario a una publicación.
   * Qué hace: Crea el comentario y aumenta en 1 el contador cantidadComentarios de la publicación.
   * Cómo lo hace: Verifica que la publicación exista, persiste el comentario y llama a publicacionesService.agregarComentario().
   */
  async crear(publicacionId: string, usuarioId: string, createDto: CreateComentarioDto) {
    await this.publicacionesService.buscarPorId(publicacionId);

    const payload = {
      usuario: usuarioId,
      publicacion: publicacionId,
      texto: createDto.texto,
    };

    const comentarioCreado = await this.comentariosRepository.crear(payload);

    await this.publicacionesService.agregarComentario(
      publicacionId,
      comentarioCreado._id.toString(),
    );

    return comentarioCreado;
  }

  /**
   * Lista los comentarios de un post y el total disponible.
   * Qué hace: Permite paginar comentarios para el botón "cargar más" de la vista de detalle.
   * Cómo lo hace: Consulta en paralelo listarPorPublicacion() y contarPorPublicacion().
   */
  async listarPorPublicacion(publicacionId: string, limit: number = 5, offset: number = 0) {
    // 404 si la publicación no existe o fue dada de baja (sus comentarios tampoco están disponibles)
    await this.publicacionesService.buscarPorId(publicacionId);

    const [comentarios, total] = await Promise.all([
      this.comentariosRepository.listarPorPublicacion(publicacionId, limit, offset),
      this.comentariosRepository.contarPorPublicacion(publicacionId),
    ]);

    return { comentarios, total };
  }

  /**
   * Modifica el mensaje de un comentario propio (Sprint 3).
   * Qué hace: Permite la edición únicamente al usuario que lo redactó y fija modificado: true.
   * Cómo lo hace: Recupera el comentario, compara autor y usuario; si no coincide lanza 403.
   */
  async actualizar(comentarioId: string, usuarioId: string, updateDto: UpdateComentarioDto) {
    const comentario = await this.comentariosRepository.buscarPorId(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const autorId = (comentario.usuario as any)?._id?.toString() || comentario.usuario.toString();
    if (autorId !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar su comentario');
    }

    return this.comentariosRepository.actualizar(comentarioId, updateDto.texto);
  }

  /**
   * Aplica baja lógica a un comentario y decrementa el contador en la publicación.
   * Qué hace: Permite la baja al autor original o a un administrador.
   * Cómo lo hace: Valida permisos (403 si no corresponde), ejecuta darDeBaja() y llama a publicacionesService.eliminarComentario().
   */
  async eliminar(comentarioId: string, usuario: { id: string; perfil: string }) {
    const comentario = await this.comentariosRepository.buscarPorId(comentarioId);
    if (!comentario) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const usuarioId = usuario.id;
    const autorId = (comentario.usuario as any)?._id?.toString() || comentario.usuario.toString();
    const esAdmin = usuario.perfil === RolUsuario.ADMIN;

    if (autorId !== usuarioId && !esAdmin) {
      throw new ForbiddenException('No tenés permisos para eliminar este comentario');
    }

    const eliminado = await this.comentariosRepository.darDeBaja(comentarioId);

    const publicacionId = (comentario.publicacion as any)?._id?.toString() || comentario.publicacion.toString();
    await this.publicacionesService.eliminarComentario(publicacionId, comentarioId);

    return eliminado;
  }
}
















