// Importamos la interfaz de configuración de aplicaciones de Angular
import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
// Importamos la función proveedora del enrutador de Angular
import { provideRouter } from '@angular/router';
// Importamos las rutas declaradas de la aplicación
import { routes } from './app.routes';
// Importamos la función para proveer HttpClient con interceptores funcionales
import { provideHttpClient, withInterceptors } from '@angular/common/http';
// Importamos nuestro interceptor de autenticación que gestiona cookies y errores 401
import { authInterceptor } from './core/interceptors/auth.interceptor';
// Importamos la función proveedora del Service Worker para la PWA
import { provideServiceWorker } from '@angular/service-worker';

/**
 * Objeto de configuración global de la aplicación Angular standalone.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Optimiza la detección de cambios de Angular agrupando eventos (event coalescing)
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Registra el sistema de enrutamiento basado en las rutas definidas en app.routes.ts
    provideRouter(routes),

    // Provee el cliente HTTP e inyecta el authInterceptor en la cadena de peticiones
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    // Registra el Service Worker de Angular únicamente en entornos de producción
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Registra el Service Worker tan pronto como la aplicación se estabilice
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
