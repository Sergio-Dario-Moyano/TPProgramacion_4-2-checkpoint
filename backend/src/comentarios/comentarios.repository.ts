// Importamos el decorador Injectable
import { Injectable } from '@nestjs/common';
// Importamos InjectModel para inyectar el modelo de Mongoose
import { InjectModel } from '@nestjs/mongoose';
// Importamos Model de Mongoose
import { Model } from 'mongoose';
// Importamos el esquema y tipo de documento
import { Comentario, ComentarioDocument } from './schemas/comentario.schema.js';

/**
 * Repositorio de acceso a datos para comentarios y agregaciones estadísticas.
 */
@Injectable()
export class ComentariosRepository {
  // Inyectamos el modelo de Mongoose para Comentario
  constructor(
    @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
  ) {}

  /**
   * Inserta un nuevo comentario y popula inmediatamente los datos públicos del autor.
   */
  async crear(payload: any): Promise<ComentarioDocument> {
    const nuevoComentario = await this.comentarioModel.create(payload);
    return nuevoComentario.populate('usuario', 'nombre apellido nombreUsuario imagen');
  }

  /**
   * Lista los comentarios activos de una publicación con paginación cronológica (más antiguos primero).
   */
  async listarPorPublicacion(
    publicacionId: string,
    limit: number = 5,
    offset: number = 0,
  ): Promise<ComentarioDocument[]> {
    return this.comentarioModel
      .find({ publicacion: publicacionId, activo: true })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Cuenta el total de comentarios activos de una publicación para control de paginación.
   */
  async contarPorPublicacion(publicacionId: string): Promise<number> {
    return this.comentarioModel
      .countDocuments({ publicacion: publicacionId, activo: true })
      .exec();
  }

  /**
   * Busca un comentario activo por su ID.
   */
  async buscarPorId(id: string): Promise<ComentarioDocument | null> {
    return this.comentarioModel
      .findOne({ _id: id, activo: true })
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Actualiza el texto de un comentario y marca el campo modificado en true.
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
   * Realiza la baja lógica del comentario (activo: false).
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

  /**
   * Agregación analítica de MongoDB: Agrupa comentarios activos por día (Timeline).
   */
  async statsTimeline(fechaInicio: Date): Promise<any[]> {
    return this.comentarioModel
      .aggregate([
        // Filtramos comentarios activos en el rango temporal seleccionado
        { $match: { createdAt: { $gte: fechaInicio }, activo: true } },
        // Agrupamos por fecha formateada en año-mes-día
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            data: { $sum: 1 },
          },
        },
        // Proyectamos el formato que consume Chart.js (label como fecha y data como conteo)
        { $project: { _id: 0, label: '$_id', data: 1 } },
        // Ordenamos cronológicamente ascendente
        { $sort: { label: 1 } },
      ])
      .exec();
  }

  /**
   * Agregación analítica de MongoDB: Agrupa comentarios por publicación (Gráfico de Dona).
   */
  async statsPorPublicacion(fechaInicio: Date): Promise<any[]> {
    return this.comentarioModel
      .aggregate([
        // 1. Filtramos comentarios activos creados a partir de la fecha de corte
        { $match: { createdAt: { $gte: fechaInicio }, activo: true } },
        // 2. Agrupamos por ID de publicación y acumulamos la cantidad de comentarios
        { $group: { _id: '$publicacion', data: { $sum: 1 } } },
        // 3. Convertimos el _id a ObjectId para asegurar la coincidencia con la colección de publicaciones
        { $addFields: { postObjId: { $toObjectId: '$_id' } } },
        // 4. Cruzamos con la colección 'publicacions' para obtener el título del apunte
        {
          $lookup: {
            from: 'publicacions',
            localField: 'postObjId',
            foreignField: '_id',
            as: 'publicacionDatos',
          },
        },
        // 5. Aplanamos el arreglo devuelto por el lookup
        { $unwind: { path: '$publicacionDatos', preserveNullAndEmptyArrays: true } },
        // 6. Proyectamos el título como label legible y la cantidad como data
        {
          $project: {
            _id: 0,
            label: {
              $ifNull: ['$publicacionDatos.titulo', 'Publicación Desconocida'],
            },
            data: 1,
          },
        },
        // 7. Ordenamos de mayor a menor interacción
        { $sort: { data: -1 } },
        // 8. Limitamos al top 5 de publicaciones más comentadas
        { $limit: 5 },
      ])
      .exec();
  }
}