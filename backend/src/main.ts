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

















