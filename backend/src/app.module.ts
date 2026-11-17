import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';
import { ComentariosModule } from './comentarios/comentarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    CloudinaryModule,
    UsuariosModule,
    AuthModule,
    PublicacionesModule,
    ComentariosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


