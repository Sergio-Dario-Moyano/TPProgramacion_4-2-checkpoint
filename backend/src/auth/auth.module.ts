// Importamos el decorador Module de NestJS
import { Module } from '@nestjs/common';
// Importamos el servicio y controlador de autenticación
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
// Importamos UsuariosModule para acceder a la persistencia de usuarios
import { UsuariosModule } from '../usuarios/usuarios.module.js';
// Importamos CloudinaryModule para el procesamiento de fotos de perfil
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
// Importamos JwtModule para la configuración asíncrona del token
import { JwtModule } from '@nestjs/jwt';
// Importamos ConfigModule y ConfigService para leer variables de entorno
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Módulo de autenticación que configura JwtModule globalmente con vencimiento a 15 minutos.
 */
@Module({
  imports: [
    // Importamos el módulo de usuarios
    UsuariosModule,
    // Importamos el módulo de Cloudinary
    CloudinaryModule,
    // Registramos JwtModule de manera asíncrona y global para todos los módulos
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      // Fábrica que lee la clave secreta y fija la expiración estricta a 15 minutos
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}