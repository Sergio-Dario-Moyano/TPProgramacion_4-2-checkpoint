// Importamos Module de NestJS
import { Module } from '@nestjs/common';
// Importamos MongooseModule para registrar el esquema de Usuario
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosRepository } from './usuarios.repository.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';

/**
 * Módulo de usuarios que encapsula persistencia, servicios y endpoints de gestión.
 */
@Module({
  imports: [
    // Registramos la colección 'usuarios' con su esquema correspondiente
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    CloudinaryModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository],
  exports: [UsuariosService, UsuariosRepository],
})
export class UsuariosModule {}