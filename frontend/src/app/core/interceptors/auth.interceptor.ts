// Importamos los tipos necesarios para interceptores funcionales y manejo de errores HTTP
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// Importamos la función de inyección de dependencias de Angular
import { inject } from '@angular/core';
// Importamos el enrutador para redireccionar ante sesiones expiradas
import { Router } from '@angular/router';
// Importamos el servicio de autenticación para reiniciar el estado del usuario
import { AuthService } from '../services/auth.service';
// Importamos el servicio del modal para avisar al usuario sobre la expiración
import { ModalService } from '../../shared/components/modal/modal.service';
// Operadores RxJS para interceptar errores y relanzarlos
import { catchError, throwError } from 'rxjs';
// Servicio de contador para cancelar los temporizadores activos de sesión
import { ContadorService } from '../services/contador.service';
// Token de contexto para omitir la intercepción cuando sea necesario
import { SKIP_INTERCEPTOR } from './http-context-tokens';

// Bandera global para evitar abrir múltiples modales si fallan varias peticiones simultáneas con 401
let flagError401 = false;

/**
 * Interceptor funcional HTTP global de Angular.
 */

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const modal = inject(ModalService);
  const contador = inject(ContadorService);

  const reqConCookies = req.clone({ withCredentials: true });

  // Rutas de autenticación que deben responder 401 sin disparar el modal de expiración
  const esRutaSilenciosa =
    req.url.includes('/auth/autorizar') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/registro');

  if (req.context.get(SKIP_INTERCEPTOR) || esRutaSilenciosa) {
    return next(reqConCookies);
  }

  return next(reqConCookies).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (flagError401) {
          return throwError(() => error);
        }

        flagError401 = true;
        contador.limpiarTimers();
        localStorage.removeItem('usuarioActual');
        auth.actualUser.set(null);

        router.navigate(['/login']).then(() => {
          modal.alerta({
            categoria: 'SESIÓN / EXPIRACIÓN',
            titulo: 'Sesión expirada',
            mensaje: 'Tu sesión ha vencido o no es válida. Por favor, ingresá nuevamente.',
            textoConfirmar: 'Entendido',
            esPeligro: true
          }).then(() => {
            flagError401 = false;
          });
        });
      }

      return throwError(() => error);
    })
  );
};















// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   // Inyectamos las dependencias requeridas dentro del contexto funcional
//   const router = inject(Router);
//   const auth = inject(AuthService);
//   const modal = inject(ModalService);
//   const contador = inject(ContadorService);

//   // Clonamos la solicitud saliente habilitando el envío y recepción de cookies HttpOnly
//   const reqConCookies = req.clone({ withCredentials: true });

//   // Verificamos si la solicitud tiene la directiva explícita de saltar este interceptor
//   if (req.context.get(SKIP_INTERCEPTOR)) {
//     // Enviamos la petición clonada directamente al siguiente manejador sin atrapar el 401
//     return next(reqConCookies);
//   }

//   // Pasamos la petición clonada y escuchamos el flujo de respuesta mediante tubería (pipe)
//   return next(reqConCookies).pipe(
//     // Capturamos cualquier error devuelto por el servidor
//     catchError((error: HttpErrorResponse) => {
//       // Comprobamos si el error corresponde a un estado 401 (No autorizado o sesión vencida)
//       if (error.status === 401) {
//         // Si ya hay un proceso de 401 ejecutándose, solo relanzamos el error para no duplicar modales
//         if (flagError401) {
//           return throwError(() => error);
//         }

//         // Marcamos la bandera en true para bloquear alertas repetidas
//         flagError401 = true;

//         // Limpiamos los temporizadores de inactividad de la sesión
//         contador.limpiarTimers();

//         // Eliminamos los datos del usuario en almacenamiento local
//         localStorage.removeItem('usuarioActual');

//         // Limpiamos el Signal del usuario autenticado en memoria
//         auth.actualUser.set(null);

//         // Redirigimos al usuario a la pantalla de login
//         router.navigate(['/login']).then(() => {
//           // Una vez redirigido, abrimos el modal estilizado notificando la expiración
//           modal.alerta({
//             categoria: 'SESIÓN / EXPIRACIÓN',
//             titulo: 'Sesión expirada',
//             mensaje: 'Tu sesión ha vencido o no es válida. Por favor, ingresá nuevamente.',
//             textoConfirmar: 'Entendido',
//             esPeligro: true
//           }).then(() => {
//             // Liberamos la bandera cuando el usuario cierra o acepta el modal
//             flagError401 = false;
//           });
//         });
//       }

//       // Propagamos el error para que el componente que realizó la llamada pueda gestionarlo si requiere
//       return throwError(() => error);
//     })
//   );
// };
