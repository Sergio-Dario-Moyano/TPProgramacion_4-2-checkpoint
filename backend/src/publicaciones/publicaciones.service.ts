import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicacionesRepository } from './publicaciones.repository.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { RolUsuario } from '../usuarios/schemas/usuario.schema.js';

@Injectable()
export class PublicacionesService {
  constructor(
    private readonly publicacionesRepository: PublicacionesRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /** Devuelve el ID del autor tanto si 'usuario' está poblado como si es un ObjectId. */
  private idAutor(publicacion: any): string {
    return (publicacion.usuario as any)?._id?.toString() || publicacion.usuario.toString();
  }

  /**
   * Alta de publicación (Sprint 2).
   * Qué hace: Guarda la publicación asociada al usuario logueado y sube la imagen si viene.
   * Cómo lo hace: CloudinaryService (carpeta 'publicaciones') + repositorio.
   */
  async crear(createDto: CreatePublicacionDto, usuarioId: string, file?: Express.Multer.File) {
    let imagenUrl: string | undefined;
    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'publicaciones');
      imagenUrl = upload?.secure_url;
    }

    return this.publicacionesRepository.crear({
      usuario: usuarioId,
      titulo: createDto.titulo.trim(),
      descripcion: createDto.descripcion.trim(),
      categoria: createDto.categoria || 'general',
      juego: createDto.juego?.trim() || '',
      imagenUrl,
    });
  }

  /**
   * Listado paginado (Sprint 2).
   * Cómo lo hace: Ejecuta en paralelo la página pedida y el total para el paginador.
   */
  async listar(queryDto: QueryPublicacionDto) {
    const [publicaciones, total] = await Promise.all([
      this.publicacionesRepository.listar(queryDto),
      this.publicacionesRepository.contar(queryDto.usuarioId, queryDto.categoria),
    ]);
    return { publicaciones, total };
  }

  async buscarPorId(id: string) {
    const publicacion = await this.publicacionesRepository.buscarPorId(id);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  /**
   * Edición de publicación.
   * Qué hace: Solo el autor puede editar (403 si no lo es). Permite cambiar texto, categoría,
   * juego e imagen (reemplazar o quitar). La publicación queda marcada como editada.
   * Cómo lo hace: Valida autoría, sube la imagen nueva si llega y guarda con el repositorio.
   */
  async actualizar(
    id: string,
    usuarioId: string,
    dto: UpdatePublicacionDto,
    file?: Express.Multer.File,
  ) {
    const publicacion = await this.buscarPorId(id);

    if (this.idAutor(publicacion) !== usuarioId) {
      throw new ForbiddenException('Solo el autor puede editar esta publicación');
    }

    const { quitarImagen, ...campos } = dto;
    const cambios: any = {};
    for (const [clave, valor] of Object.entries(campos)) {
      if (valor !== undefined) cambios[clave] = typeof valor === 'string' ? valor.trim() : valor;
    }

    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'publicaciones');
      cambios.imagenUrl = upload?.secure_url;
    }

    const debeQuitarImagen = !file && quitarImagen === 'true';
    if (Object.keys(cambios).length === 0 && !debeQuitarImagen) {
      throw new BadRequestException('No enviaste ningún cambio');
    }

    return this.publicacionesRepository.actualizar(id, cambios, debeQuitarImagen);
  }

  /**
   * Baja lógica (Sprint 2 y 4).
   * Qué hace: La puede hacer el autor o un administrador. También oculta los comentarios.
   * Cómo lo hace: Valida permisos (403) y delega en el repositorio.
   */
  async darDeBaja(id: string, usuario: { id: string; perfil: string }) {
    const publicacion = await this.buscarPorId(id);

    if (this.idAutor(publicacion) !== usuario.id && usuario.perfil !== RolUsuario.ADMIN) {
      throw new ForbiddenException('No tenés permiso para eliminar esta publicación');
    }

    return this.publicacionesRepository.darDeBaja(id);
  }

  /**
   * Me gusta (Sprint 2). Un usuario puede dar un solo me gusta por publicación.
   * Errores: 404 si la publicación no existe, 409 si ya le había dado me gusta.
   */
  async darMeGusta(id: string, usuarioId: string) {
    await this.buscarPorId(id);
    const publicacion = await this.publicacionesRepository.darMeGusta(id, usuarioId);
    if (!publicacion) throw new ConflictException('Ya le diste me gusta a esta publicación');
    return publicacion;
  }

  /**
   * Quitar me gusta (Sprint 2). Solo si el usuario lo había dado.
   * Errores: 404 si la publicación no existe, 409 si no había me gusta previo.
   */
  async quitarMeGusta(id: string, usuarioId: string) {
    await this.buscarPorId(id);
    const publicacion = await this.publicacionesRepository.quitarMeGusta(id, usuarioId);
    if (!publicacion) throw new ConflictException('No le habías dado me gusta a esta publicación');
    return publicacion;
  }

  async agregarComentario(publicacionId: string, comentarioId: string) {
    const publicacion = await this.publicacionesRepository.agregarComentario(publicacionId, comentarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }

  async eliminarComentario(publicacionId: string, comentarioId: string) {
    const publicacion = await this.publicacionesRepository.eliminarComentario(publicacionId, comentarioId);
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');
    return publicacion;
  }
}



