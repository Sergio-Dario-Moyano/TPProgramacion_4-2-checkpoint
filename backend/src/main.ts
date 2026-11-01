// Importamos la fábrica principal de NestJS
import { NestFactory } from '@nestjs/core';
// Importamos el módulo raíz de la aplicación
import { AppModule } from './app.module.js';
// Importamos el ValidationPipe para validar y transformar DTOs automáticamente
import { ValidationPipe } from '@nestjs/common';
// Importamos cookie-parser para procesar las cookies entrantes en el objeto Request
import cookieParser from 'cookie-parser';
// Importamos SwaggerModule y DocumentBuilder para documentar la API REST
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

/**
 * Función de arranque (bootstrap) de la aplicación NestJS.
 */
async function bootstrap() {
  // Instanciamos el servidor NestJS a partir de AppModule
  const app = await NestFactory.create(AppModule);

  // Middleware global para parsear las cookies HttpOnly enviadas por el navegador
  app.use(cookieParser());

  // Habilitamos CORS configurado para aceptar credenciales (cookies) desde el frontend
  app.enableCors({
    // Permitimos peticiones originadas desde el servidor de desarrollo de Angular
    origin: ['http://localhost:4200'],
    // Permitimos explícitamente el intercambio de cookies en solicitudes de origen cruzado
    credentials: true,
  });

  // Registramos el ValidationPipe global para sanear y validar todos los DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      // Remueve propiedades que no estén declaradas en los DTOs
      whitelist: true,
      // Rechaza peticiones si se envían datos ajenos a la definición del DTO
      forbidNonWhitelisted: true,
      // Convierte automáticamente los payloads JSON a las clases e instancias tipadas
      transform: true,
    }),
  );

  // Configuración de la documentación interactiva OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('UTN-BUGS API')
    .setDescription('Documentación de los endpoints de la red social académica UTN-BUGS')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('usuarios')
    .addTag('publicaciones')
    .addTag('comentarios')
    .addTag('estadisticas')
    .build();

  // Generamos el documento Swagger y lo montamos en la ruta /api
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Leemos el puerto asignado por las variables de entorno o usamos el puerto 3000 por defecto
  const port = process.env.PORT || 3000;
  // Iniciamos la escucha del servidor HTTP
  await app.listen(port);
  console.log(`Servidor UTN-BUGS corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger disponible en: http://localhost:${port}/api`);
}

// Invocamos la inicialización del servidor
bootstrap();
