import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema.js';
import { Comentario, ComentarioDocument } from '../comentarios/schemas/comentario.schema.js';
import { Usuario, UsuarioDocument } from '../usuarios/schemas/usuario.schema.js';
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';

const CAMPOS_AUTOR = 'nombre apellido nombreUsuario imagen descripcion perfil';

@Injectable()
export class PublicacionesRepository {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<ComentarioDocument>,
    @InjectModel(Usuario.name) private readonly usuarioModel: Model<UsuarioDocument>,
  ) {}

  /** Arma el filtro base del listado (solo publicaciones activas). */
  private filtroListado(usuarioId?: string, categoria?: string) {
    const filtro: any = { activo: true };
    if (usuarioId) filtro.usuario = usuarioId;
    if (categoria) filtro.categoria = categoria;
    return filtro;
  }

  /**
   * Crea una publicación.
   * Qué hace: Persiste la publicación y devuelve los datos públicos del autor.
   * Cómo lo hace: create() + populate('usuario').
   */
  async crear(payload: any): Promise<PublicacionDocument> {
    const nuevaPublicacion = await this.publicacionModel.create(payload);
    return nuevaPublicacion.populate('usuario', CAMPOS_AUTOR);
  }

  /**
   * Lista publicaciones paginadas (Sprint 2).
   * Qué hace: Filtra por autor y categoría; ordena por fecha o por cantidad de me gusta.
   * Cómo lo hace: find + sort + skip(offset) + limit.
   */
  async listar(queryDto: QueryPublicacionDto): Promise<PublicacionDocument[]> {
    const { offset, limit, orden, usuarioId, categoria } = queryDto;
    const sortParams: any =
      orden === 'meGustas' ? { cantidadMeGustas: -1, createdAt: -1 } : { createdAt: -1 };

    return this.publicacionModel
      .find(this.filtroListado(usuarioId, categoria))
      .sort(sortParams)
      .skip(offset ?? 0)
      .limit(limit ?? 5)
      .populate('usuario', CAMPOS_AUTOR)
      .exec();
  }

  async contar(usuarioId?: string, categoria?: string): Promise<number> {
    return this.publicacionModel.countDocuments(this.filtroListado(usuarioId, categoria)).exec();
  }

  async buscarPorId(id: string): Promise<PublicacionDocument | null> {
    return this.publicacionModel
      .findOne({ _id: id, activo: true })
      .populate('usuario', CAMPOS_AUTOR)
      .exec();
  }

  /**
   * Edita una publicación.
   * Qué hace: Aplica los cambios y marca modificado: true.
   * Cómo lo hace: findByIdAndUpdate con $set / $unset para la imagen.
   */
  async actualizar(id: string, cambios: any, quitarImagen: boolean): Promise<PublicacionDocument | null> {
    const update: any = { $set: { ...cambios, modificado: true } };
    if (quitarImagen) update.$unset = { imagenUrl: '' };

    return this.publicacionModel
      .findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true })
      .populate('usuario', CAMPOS_AUTOR)
      .exec();
  }

  /**
   * Baja lógica de una publicación y sus comentarios (Sprint 2 y 4).
   * Qué hace: La publicación y sus comentarios dejan de estar disponibles.
   * Cómo lo hace: activo: false en la publicación y updateMany en sus comentarios.
   */
  async darDeBaja(id: string): Promise<PublicacionDocument | null> {
    const publicacion = await this.publicacionModel
      .findByIdAndUpdate(id, { activo: false }, { returnDocument: 'after' })
      .exec();
    await this.comentarioModel.updateMany({ publicacion: id }, { activo: false }).exec();
    return publicacion;
  }

  /**
   * Agrega un me gusta (un solo me gusta por usuario).
   * Cómo lo hace: findOneAndUpdate con condición meGustas $ne usuario; si ya existe devuelve null.
   */
  async darMeGusta(publicacionId: string, usuarioId: string) {
    return this.publicacionModel
      .findOneAndUpdate(
        { _id: publicacionId, activo: true, meGustas: { $ne: usuarioId } },
        { $push: { meGustas: usuarioId }, $inc: { cantidadMeGustas: 1 } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /**
   * Quita un me gusta (solo si el usuario lo había dado).
   * Cómo lo hace: findOneAndUpdate con condición meGustas contiene al usuario; si no, devuelve null.
   */
  async quitarMeGusta(publicacionId: string, usuarioId: string) {
    return this.publicacionModel
      .findOneAndUpdate(
        { _id: publicacionId, activo: true, meGustas: usuarioId },
        { $pull: { meGustas: usuarioId }, $inc: { cantidadMeGustas: -1 } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async agregarComentario(publicacionId: string, comentarioId: string) {
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        { $push: { comentarios: comentarioId }, $inc: { cantidadComentarios: 1 } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async eliminarComentario(publicacionId: string, comentarioId: string) {
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        { $pull: { comentarios: comentarioId }, $inc: { cantidadComentarios: -1 } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  // ---------------------------------------------------------------
  // Estadísticas (Sprint 4)
  // ---------------------------------------------------------------

  /**
   * Publicaciones realizadas por cada usuario en un lapso.
   * Cómo lo hace: aggregate ($match por fecha + $group por usuario) y después busca los datos de
   * esos usuarios con find(). No usa $lookup: así no depende del nombre interno de la colección
   * ni de que los IDs estén guardados como ObjectId o como texto.
   */
  async publicacionesPorUsuario(desde: Date, hasta: Date) {
    const grupos: { _id: any; cantidad: number }[] = await this.publicacionModel
      .aggregate([
        { $match: { createdAt: { $gte: desde, $lte: hasta } } },
        { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
      ])
      .exec();

    const ids = grupos.map((g) => String(g._id));
    const usuarios = await this.usuarioModel
      .find({ _id: { $in: ids } })
      .select('nombre apellido nombreUsuario')
      .lean()
      .exec();
    const porId = new Map(usuarios.map((u: any) => [String(u._id), u]));

    return grupos
      .map((g) => {
        const u: any = porId.get(String(g._id));
        return {
          usuarioId: String(g._id),
          nombreUsuario: u?.nombreUsuario ?? 'usuario-eliminado',
          nombre: u ? `${u.nombre} ${u.apellido}` : 'Usuario eliminado',
          cantidad: g.cantidad,
        };
      })
      .sort((a, b) => b.cantidad - a.cantidad || a.nombreUsuario.localeCompare(b.nombreUsuario));
  }

  /**
   * Comentarios realizados en un lapso, agrupados por día.
   * Cómo lo hace: aggregate → $match por fecha → $group por día (hora de Argentina).
   */
  async comentariosPorDia(desde: Date, hasta: Date) {
    return this.comentarioModel
      .aggregate([
        { $match: { createdAt: { $gte: desde, $lte: hasta } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'America/Argentina/Buenos_Aires',
              },
            },
            cantidad: { $sum: 1 },
          },
        },
        { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
        { $sort: { fecha: 1 } },
      ])
      .exec();
  }

  /**
   * Comentarios de cada publicación en un lapso (las `limite` más comentadas).
   * Cómo lo hace: aggregate ($match por fecha + $group por publicación + orden) y después busca
   * título y estado de esas publicaciones con find(). Tampoco usa $lookup.
   */
  async comentariosPorPublicacion(desde: Date, hasta: Date, limite = 10) {
    const grupos: { _id: any; cantidad: number }[] = await this.comentarioModel
      .aggregate([
        { $match: { createdAt: { $gte: desde, $lte: hasta } } },
        { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
        { $limit: limite },
      ])
      .exec();

    const ids = grupos.map((g) => String(g._id));
    const publicaciones = await this.publicacionModel
      .find({ _id: { $in: ids } })
      .select('titulo activo')
      .lean()
      .exec();
    const porId = new Map(publicaciones.map((p: any) => [String(p._id), p]));

    // Se descartan comentarios "huérfanos" (su publicación ya no existe en la base, por ejemplo
    // si se borró a mano desde Atlas). Las dadas de baja lógica sí se muestran, marcadas.
    return grupos
      .filter((g) => porId.has(String(g._id)))
      .map((g) => {
        const p: any = porId.get(String(g._id));
        return {
          publicacionId: String(g._id),
          titulo: p.titulo,
          activa: p.activo,
          cantidad: g.cantidad,
        };
      });
  }
}
