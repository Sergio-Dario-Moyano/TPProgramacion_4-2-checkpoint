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















// // Importamos el decorador Module de NestJS
// import { Module } from '@nestjs/common';
// // Importamos ConfigModule y ConfigService para leer variables de entorno .env globalmente
// import { ConfigModule, ConfigService } from '@nestjs/config';
// // Importamos MongooseModule para establecer la conexión a MongoDB
// import { MongooseModule } from '@nestjs/mongoose';
// // Importamos los módulos funcionales del sistema
// import { AuthModule } from './auth/auth.module.js';
// import { UsuariosModule } from './usuarios/usuarios.module.js';
// import { PublicacionesModule } from './publicaciones/publicaciones.module.js';
// import { ComentariosModule } from './comentarios/comentarios.module.js';
// import { CloudinaryModule } from './cloudinary/cloudinary.module.js';

// /**
//  * Módulo raíz que centraliza la configuración, base de datos y orquestación de sub-módulos.
//  */
// @Module({
//   imports: [
//     // Configuramos ConfigModule de forma global para leer variables del archivo .env
//     ConfigModule.forRoot({
//       isGlobal: true,
//       envFilePath: '.env',
//     }),

//     // Conectamos a MongoDB de manera asíncrona inyectando ConfigService
//     MongooseModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         uri: configService.get<string>('MONGO_URI') || configService.get<string>('MONGODB_URI'),
//       }),
//     }),

//     // Registramos todos los módulos del backend
//     CloudinaryModule,
//     UsuariosModule,
//     AuthModule,
//     PublicacionesModule,
//     ComentariosModule,
//   ],
// })
// export class AppModule {}
