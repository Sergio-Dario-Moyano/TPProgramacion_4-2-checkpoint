import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Función de arranque del cliente frontend.
 * Qué hace: Inicializa la aplicación Angular montando el componente raíz 'App'.
 * Cómo lo hace: Invoca bootstrapApplication() pasándole el componente App y la configuración provista en appConfig.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error('Error al inicializar la aplicación:', err));
