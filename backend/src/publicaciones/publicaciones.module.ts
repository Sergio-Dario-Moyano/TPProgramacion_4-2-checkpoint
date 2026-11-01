// Importamos el decorador Module y forwardRef para resolver dependencias circulares con comentarios
import { Module, forwardRef } from '@nestjs/common';
// Importamos MongooseModule para registrar el esquema de Publicacion
import { MongooseModule } from '@nestjs/mongoose';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema.js';
// Importamos servicios, controladores y repositorios
import { PublicacionesService } from './publicaciones.service.js';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesRepository } from './publicaciones.repository.js';
import { EstadisticasController } from './estadisticas.controller.js';
// Importamos módulos relacionados
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { ComentariosModule } from '../comentarios/comentarios.module.js';

/**
 * Módulo de publicaciones y estadísticas analíticas.
 */
@Module({
  imports: [
    // Registramos la colección de publicaciones con su esquema en Mongoose
    MongooseModule.forFeature([{ name: Publicacion.name, schema: PublicacionSchema }]),
    CloudinaryModule,
    UsuariosModule,
    // Vinculamos ComentariosModule de forma diferida (forwardRef) para resolver el ciclo bidireccional
    forwardRef(() => ComentariosModule),
  ],
  controllers: [PublicacionesController, EstadisticasController],
  providers: [PublicacionesService, PublicacionesRepository],
  exports: [PublicacionesService, PublicacionesRepository],
})
export class PublicacionesModule {}