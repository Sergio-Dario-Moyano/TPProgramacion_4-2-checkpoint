import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * PWA: captura del evento de instalación.
 * Qué hace: Guarda el evento 'beforeinstallprompt' apenas el navegador lo dispara.
 * Por qué acá: El navegador lo dispara UNA sola vez, al cargar la página, cuando todavía se está
 * en /cargando o /login (sin navbar). Si se escuchara recién en el servicio, el evento ya habría
 * pasado y el botón "Instalar app" nunca aparecería. InstalarPwaService lo lee desde window.
 */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).eventoInstalarPwa = e;
  window.dispatchEvent(new Event('pwa-instalable'));
});

/**
 * Función de arranque del cliente frontend.
 * Qué hace: Inicializa la aplicación Angular montando el componente raíz 'App'.
 * Cómo lo hace: Invoca bootstrapApplication() pasándole el componente App y la configuración provista en appConfig.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error('Error al inicializar la aplicación:', err));
