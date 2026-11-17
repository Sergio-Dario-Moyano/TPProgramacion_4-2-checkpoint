import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosRepository } from './comentarios.repository.js';
import { PublicacionesModule } from '../publicaciones/publicaciones.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

/**
 * Módulo de Comentarios.
 * Qué hace: Agrupa controladores, servicios y repositorio de comentarios.
 * Cómo lo hace: Importa PublicacionesModule para validar la publicación y mantener sus contadores.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comentario.name, schema: ComentarioSchema }]),
    PublicacionesModule,
    UsuariosModule,
  ],
  controllers: [ComentariosController],
  providers: [ComentariosService, ComentariosRepository],
  exports: [ComentariosService, ComentariosRepository],
})
export class ComentariosModule {}














