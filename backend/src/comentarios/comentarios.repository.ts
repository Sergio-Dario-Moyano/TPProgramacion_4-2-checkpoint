import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';

@Injectable()
export class ComentariosRepository {
  constructor(
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<ComentarioDocument>,
  ) {}

  /**
   * Guarda un nuevo comentario en MongoDB.
   * Qué hace: Persiste el comentario y puebla los datos públicos del autor.
   * Cómo lo hace: Invoca comentarioModel.create() y ejecuta populate() sobre 'usuario'.
   */
  async crear(payload: any): Promise<ComentarioDocument> {
    const nuevoComentario = await this.comentarioModel.create(payload);
    return nuevoComentario.populate('usuario', 'nombre apellido nombreUsuario imagen');
  }

  /**
   * Lista los comentarios de una publicación paginados y ordenados.
   * Qué hace: Devuelve los comentarios activos, los más recientes primero (Requisito Sprint 3 Back).
   * Cómo lo hace: Ejecuta find({ publicacion, activo: true }), sort({ createdAt: -1 }), skip(), limit() y populate().
   */
  async listarPorPublicacion(
    publicacionId: string,
    limit: number = 5,
    offset: number = 0,
  ): Promise<ComentarioDocument[]> {
    return this.comentarioModel
      .find({ publicacion: publicacionId, activo: true })
      .sort({ createdAt: -1 }) // Los más recientes primero
      .skip(offset)
      .limit(limit)
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Cuenta los comentarios activos de una publicación.
   * Qué hace: Devuelve el total para controlar la paginación con "cargar más" en el frontend.
   * Cómo lo hace: Ejecuta countDocuments({ publicacion, activo: true }).
   */
  async contarPorPublicacion(publicacionId: string): Promise<number> {
    return this.comentarioModel
      .countDocuments({ publicacion: publicacionId, activo: true })
      .exec();
  }

  /**
   * Busca un comentario activo por ID.
   * Qué hace: Recupera el comentario para verificar autoría antes de editar o borrar.
   * Cómo lo hace: Ejecuta findOne({ _id, activo: true }) con populate().
   */
  async buscarPorId(id: string): Promise<ComentarioDocument | null> {
    return this.comentarioModel
      .findOne({ _id: id, activo: true })
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Actualiza el texto y marca modificado: true (Sprint 3).
   * Qué hace: Guarda el nuevo texto y deja constancia de la edición.
   * Cómo lo hace: Invoca findByIdAndUpdate(id, { texto, modificado: true }).
   */
  async actualizar(id: string, nuevoTexto: string): Promise<ComentarioDocument | null> {
    return this.comentarioModel
      .findByIdAndUpdate(
        id,
        { texto: nuevoTexto, modificado: true },
        { returnDocument: 'after' },
      )
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Aplica la baja lógica a un comentario.
   * Qué hace: Oculta el comentario marcando activo: false.
   * Cómo lo hace: Invoca findByIdAndUpdate(id, { activo: false }).
   */
  async darDeBaja(id: string): Promise<ComentarioDocument | null> {
    return this.comentarioModel
      .findByIdAndUpdate(
        id,
        { activo: false },
        { returnDocument: 'after' },
      )
      .exec();
  }
}












