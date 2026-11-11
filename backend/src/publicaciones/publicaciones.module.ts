import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';
import { Comentario, ComentarioSchema } from '../comentarios/schemas/comentario.schema.js';
import { Usuario, UsuarioSchema } from '../usuarios/schemas/usuario.schema.js';
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { EstadisticasController } from './estadisticas.controller.js';
import { PublicacionesRepository } from './publicaciones.repository.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

/**
 * Módulo de Publicaciones.
 * Qué hace: Publicaciones, me gusta y estadísticas (Sprint 4).
 * Cómo lo hace: Registra también el modelo Comentario para dar de baja los comentarios junto con
 * la publicación y para las estadísticas, sin generar dependencia circular con ComentariosModule.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
      { name: Usuario.name, schema: UsuarioSchema },
    ]),
    CloudinaryModule,
    UsuariosModule,
  ],
  controllers: [PublicacionesController, EstadisticasController],
  providers: [PublicacionesService, PublicacionesRepository],
  exports: [PublicacionesService, PublicacionesRepository],
})
export class PublicacionesModule {}
