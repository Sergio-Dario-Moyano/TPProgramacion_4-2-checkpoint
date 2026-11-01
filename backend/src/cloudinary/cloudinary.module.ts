// Importamos el decorador Module de NestJS
import { Module } from '@nestjs/common';
// Importamos el servicio y el proveedor de Cloudinary
import { CloudinaryService } from './cloudinary.service.js';
import { CloudinaryProvider } from './cloudinary.config.js';

/**
 * Módulo que exporta el CloudinaryService para su uso en Auth, Usuarios y Publicaciones.
 */
@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}