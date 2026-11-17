import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema.js';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosRepository } from './usuarios.repository.js';
import { UsuariosController } from './usuarios.controller.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';

/**
 * Módulo de Usuarios.
 * Qué hace: Expone la edición del perfil propio y la administración de usuarios (Sprint 4).
 * Cómo lo hace: Registra el schema Usuario, el repositorio, el servicio y el controlador.
 * Exporta UsuariosService y JwtGuard para que los demás módulos protejan sus rutas.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    CloudinaryModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository, JwtGuard],
  exports: [UsuariosService, UsuariosRepository, JwtGuard],
})
export class UsuariosModule {}


















