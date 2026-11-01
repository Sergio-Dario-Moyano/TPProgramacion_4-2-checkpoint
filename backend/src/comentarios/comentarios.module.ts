// Importamos Module y forwardRef para resolver la relación bidireccional con PublicacionesModule
import { Module, forwardRef } from '@nestjs/common';
// Importamos MongooseModule para registrar la colección 'comentarios'
import { MongooseModule } from '@nestjs/mongoose';
import { Comentario, ComentarioSchema } from './schemas/comentario.schema.js';
import { ComentariosService } from './comentarios.service.js';
import { ComentariosController } from './comentarios.controller.js';
import { ComentariosRepository } from './comentarios.repository.js';
import { PublicacionesModule } from '../publicaciones/publicaciones.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

/**
 * Módulo de comentarios con soporte para operaciones atómicas cruzadas y estadísticas.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Comentario.name, schema: ComentarioSchema }]),
    forwardRef(() => PublicacionesModule),
    UsuariosModule,
  ],
  controllers: [ComentariosController],
  providers: [ComentariosService, ComentariosRepository],
  exports: [ComentariosService, ComentariosRepository],
})
export class ComentariosModule {}