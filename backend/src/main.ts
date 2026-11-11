import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const cookieParser = require('cookie-parser');

/**
 * Función de arranque del servidor backend.
 * Qué hace: Inicializa NestJS, registra cookies, CORS y validación global de DTOs, y publica la API.
 * Cómo lo hace: Instancia NestFactory.create(AppModule), añade cookieParser(), habilita CORS con credenciales
 * para localhost, para la URL del frontend desplegado (FRONTEND_URL) y para los previews de Vercel del proyecto,
 * y monta el ValidationPipe global.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware para leer la cookie HttpOnly 'autorizacion'
  app.use(cookieParser());

  // Orígenes permitidos: desarrollo local + frontend desplegado (sin barra final)
  const origenes = ['http://localhost:4200'];
  if (process.env.FRONTEND_URL) {
    origenes.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
  }

  // Previews de Vercel de este proyecto (la URL cambia en cada deploy)
  const previewVercel = /^https:\/\/utn-bugs-tpp-4[a-z0-9-]*\.vercel\.app$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Sin origin = Postman, curl o peticiones del mismo servidor
      if (!origin || origenes.includes(origin) || previewVercel.test(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS bloqueado para: ${origin}`);
      return callback(new Error('No permitido por CORS'), false);
    },
    credentials: true,
  });

  // Validador global: rechaza propiedades no declaradas en los DTOs y transforma tipos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor Checkpoint corriendo en el puerto ${port}`);
}

bootstrap();

















// // Importamos la fábrica principal de NestJS
// import { NestFactory } from '@nestjs/core';
// // Importamos el módulo raíz de la aplicación
// import { AppModule } from './app.module.js';
// // Importamos el ValidationPipe para validar y transformar DTOs automáticamente
// import { ValidationPipe } from '@nestjs/common';
// // Importamos cookie-parser para procesar las cookies entrantes en el objeto Request
// import cookieParser from 'cookie-parser';
// // Importamos SwaggerModule y DocumentBuilder para documentar la API REST
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// /**
//  * Función de arranque (bootstrap) de la aplicación NestJS.
//  */
// async function bootstrap() {
//   // Instanciamos el servidor NestJS a partir de AppModule
//   const app = await NestFactory.create(AppModule);

//   // Middleware global para parsear las cookies HttpOnly enviadas por el navegador
//   app.use(cookieParser());

//   // Habilitamos CORS configurado para aceptar credenciales (cookies) desde el frontend
//   app.enableCors({
//     // Permitimos peticiones originadas desde el servidor de desarrollo de Angular
//     origin: ['http://localhost:4200'],
//     // Permitimos explícitamente el intercambio de cookies en solicitudes de origen cruzado
//     credentials: true,
//   });

//   // Registramos el ValidationPipe global para sanear y validar todos los DTOs
//   app.useGlobalPipes(
//     new ValidationPipe({
//       // Remueve propiedades que no estén declaradas en los DTOs
//       whitelist: true,
//       // Rechaza peticiones si se envían datos ajenos a la definición del DTO
//       forbidNonWhitelisted: true,
//       // Convierte automáticamente los payloads JSON a las clases e instancias tipadas
//       transform: true,
//     }),
//   );

//   // Configuración de la documentación interactiva OpenAPI / Swagger
//   const config = new DocumentBuilder()
//     .setTitle('UTN-BUGS API')
//     .setDescription('Documentación de los endpoints de la red social académica UTN-BUGS')
//     .setVersion('1.0')
//     .addTag('auth')
//     .addTag('usuarios')
//     .addTag('publicaciones')
//     .addTag('comentarios')
//     .addTag('estadisticas')
//     .build();

//   // Generamos el documento Swagger y lo montamos en la ruta /api
//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);

//   // Leemos el puerto asignado por las variables de entorno o usamos el puerto 3000 por defecto
//   const port = process.env.PORT || 3000;
//   // Iniciamos la escucha del servidor HTTP
//   await app.listen(port);
//   console.log(`Servidor UTN-BUGS corriendo en: http://localhost:${port}`);
//   console.log(`Documentación Swagger disponible en: http://localhost:${port}/api`);
// }

// // Invocamos la inicialización del servidor
// bootstrap();
