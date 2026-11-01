// Importamos el SDK v2 de Cloudinary
import { v2 as cloudinary } from 'cloudinary';
// Importamos el ConfigService de NestJS para leer variables de entorno
import { ConfigService } from '@nestjs/config';

/**
 * Proveedor personalizado que inicializa la configuración global del SDK de Cloudinary.
 */
export const CloudinaryProvider = {
  // Token de inyección de dependencia
  provide: 'CLOUDINARY',
  // Fábrica asíncrona que extrae las credenciales del archivo .env
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  },
  // Inyectamos ConfigService en la fábrica
  inject: [ConfigService],
};