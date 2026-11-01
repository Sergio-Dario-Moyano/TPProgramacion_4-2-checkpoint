// Importamos el decorador Injectable
import { Injectable } from '@nestjs/common';
// Importamos InjectModel para inyectar el modelo de Mongoose
import { InjectModel } from '@nestjs/mongoose';
// Importamos Model de Mongoose
import { Model } from 'mongoose';
// Importamos el esquema y tipo de documento
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema.js';
// Importamos el DTO de consulta
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';

/**
 * Repositorio de acceso a datos para publicaciones y agregaciones estadísticas.
 */
@Injectable()
export class PublicacionesRepository {
  // Inyectamos el modelo de Publicacion
  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
  ) {}

  /**
   * Inserta una nueva publicación en la base de datos y popula los datos públicos del autor.
   */
  async crear(payload: any): Promise<PublicacionDocument> {
    const nuevaPublicacion = await this.publicacionModel.create(payload);
    return nuevaPublicacion.populate('usuario', 'nombre apellido nombreUsuario imagen');
  }

  /**
   * Lista publicaciones activas aplicando filtros, orden dinámico, paginación y población del autor.
   */
  async listar(queryDto: QueryPublicacionDto): Promise<PublicacionDocument[]> {
    const { offset, limit, orden, usuarioId } = queryDto;

    // Filtramos únicamente documentos con baja lógica inactiva (activo: true)
    const filtro: any = { activo: true };

    // Si se especifica usuarioId, filtramos por sus publicaciones
    if (usuarioId) {
      filtro.usuario = usuarioId;
    }

    // Configuramos el orden: por meGustas descendente o por fecha (createdAt) descendente
    const sortParams: any =
      orden === 'meGustas'
        ? { cantidadMeGustas: -1, createdAt: -1 }
        : { createdAt: -1 };

    // Ejecutamos la consulta con saltos (skip) y límites (limit)
    return this.publicacionModel
      .find(filtro)
      .sort(sortParams)
      .skip(offset ?? 0)
      .limit(limit ?? 10)
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Busca una publicación activa por su ID.
   */
  async buscarPorId(id: string): Promise<PublicacionDocument | null> {
    return this.publicacionModel
      .findOne({ _id: id, activo: true })
      .populate('usuario', 'nombre apellido nombreUsuario imagen')
      .exec();
  }

  /**
   * Aplica la baja lógica a una publicación (activo: false).
   */
  async darDeBaja(id: string): Promise<PublicacionDocument | null> {
    return this.publicacionModel
      .findByIdAndUpdate(
        id,
        { activo: false },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Agrega un Me Gusta de forma atómica evitando duplicados mediante $ne y $push.
   */
  async darMeGusta(publicacionId: string, usuarioId: string) {
    return this.publicacionModel
      .findOneAndUpdate(
        { _id: publicacionId, activo: true, meGustas: { $ne: usuarioId } },
        {
          $push: { meGustas: usuarioId },
          $inc: { cantidadMeGustas: 1 },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Remueve un Me Gusta existente de forma atómica mediante $pull y decrementa el contador.
   */
  async quitarMeGusta(publicacionId: string, usuarioId: string) {
    return this.publicacionModel
      .findOneAndUpdate(
        { _id: publicacionId, activo: true, meGustas: usuarioId },
        {
          $pull: { meGustas: usuarioId },
          $inc: { cantidadMeGustas: -1 },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Agrega el ID del comentario y aumenta en 1 la cantidad de comentarios en el post.
   */
  async agregarComentario(publicacionId: string, comentarioId: string) {
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        {
          $push: { comentarios: comentarioId },
          $inc: { cantidadComentarios: 1 },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Remueve el ID del comentario y decrementa en 1 la cantidad de comentarios en el post.
   */
  async eliminarComentario(publicacionId: string, comentarioId: string) {
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        {
          $pull: { comentarios: comentarioId },
          $inc: { cantidadComentarios: -1 },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Pipeline analítico de MongoDB: agrupa publicaciones activas por usuario en un lapso de tiempo.
   */
  async statsPublicacionesPorUsuario(fechaInicio: Date): Promise<any[]> {
    return this.publicacionModel
      .aggregate([
        // 1. Filtramos documentos activos dentro del rango de fecha especificado
        { $match: { createdAt: { $gte: fechaInicio }, activo: true } },
        // 2. Agrupamos por el ID del usuario y acumulamos el conteo
        { $group: { _id: '$usuario', data: { $sum: 1 } } },
        // 3. Convertimos el _id resultante en un ObjectId válido para la unión
        { $addFields: { userIdObj: { $toObjectId: '$_id' } } },
        // 4. Hacemos lookup contra la colección 'usuarios' para traer sus datos
        {
          $lookup: {
            from: 'usuarios',
            localField: 'userIdObj',
            foreignField: '_id',
            as: 'usuarioDatos',
          },
        },
        // 5. Desanidamos el arreglo resultante conservando nulos
        { $unwind: { path: '$usuarioDatos', preserveNullAndEmptyArrays: true } },
        // 6. Proyectamos el formato que consume Chart.js (label con alias y data con cantidad)
        {
          $project: {
            _id: 0,
            label: {
              $ifNull: [{ $concat: ['@', '$usuarioDatos.nombreUsuario'] }, 'Usuario Eliminado'],
            },
            data: 1,
          },
        },
        // 7. Ordenamos descendentemente por mayor cantidad de publicaciones
        { $sort: { data: -1 } },
        // 8. Limitamos a los 10 usuarios con mayor participación
        { $limit: 10 },
      ])
      .exec();
  }
}