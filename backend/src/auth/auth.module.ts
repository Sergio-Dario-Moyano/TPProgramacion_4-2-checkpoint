import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';

/**
 * Módulo de Autenticación.
 * Qué hace: Centraliza registro, login, autorizar, refrescar y logout.
 * Cómo lo hace: Registra JwtModule como global (lo usan los guards de todos los módulos)
 * con vencimiento de SESION_MINUTOS minutos (15 por defecto, como pide la consigna).
 */
@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: `${Number(configService.get('SESION_MINUTOS') ?? 15)}m` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}















