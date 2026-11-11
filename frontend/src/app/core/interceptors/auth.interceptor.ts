import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import { SKIP_INTERCEPTOR } from './http-context-tokens';

/** Evita abrir varios modales si fallan varias peticiones a la vez. */
let manejando401 = false;

/**
 * Interceptor de autenticación (Sprint 3).
 * Qué hace:
 *  1. Agrega el token guardado en el header Authorization y envía las cookies (withCredentials).
 *  2. Si una petición devuelve 401, limpia la sesión y redirige al login para rehacer el token.
 *  3. Si devuelve 403, avisa con un modal que la acción no está permitida.
 * Las rutas de login, registro y autorizar manejan sus propios errores (por ejemplo,
 * "contraseña incorrecta" es un 401 que se muestra en el formulario, no una sesión vencida).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const modal = inject(ModalService);

  const token = auth.token;
  const peticion = req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const esRutaSilenciosa =
    req.context.get(SKIP_INTERCEPTOR) ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/registro');

  if (esRutaSilenciosa) {
    return next(peticion);
  }

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !manejando401) {
        manejando401 = true;
        auth.limpiarSesion();

        router.navigate(['/login']).then(() => {
          modal
            .alerta({
              categoria: 'ERROR 401 / NO AUTORIZADO',
              titulo: 'Necesitás volver a ingresar',
              mensaje:
                error.error?.message ??
                'Tu sesión venció o no es válida. Iniciá sesión de nuevo para continuar.',
              textoConfirmar: 'Ir al login',
              tipoIcono: 'alert',
              esPeligro: true
            })
            .finally(() => (manejando401 = false));
        });
      }

      if (error.status === 403) {
        modal.alerta({
          categoria: 'ERROR 403 / PERMISOS',
          titulo: 'Acción no permitida',
          mensaje: error.error?.message ?? 'No tenés permiso para realizar esta acción.',
          textoConfirmar: 'Entendido',
          tipoIcono: 'alert',
          esPeligro: true
        });
      }

      return throwError(() => error);
    })
  );
};


















// // Importamos los tipos necesarios para interceptores funcionales y manejo de errores HTTP
// import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// // Importamos la función de inyección de dependencias de Angular
// import { inject } from '@angular/core';
// // Importamos el enrutador para redireccionar ante sesiones expiradas
// import { Router } from '@angular/router';
// // Importamos el servicio de autenticación para reiniciar el estado del usuario
// import { AuthService } from '../services/auth.service';
// // Importamos el servicio del modal para avisar al usuario sobre la expiración
// import { ModalService } from '../../shared/components/modal/modal.service';
// // Operadores RxJS para interceptar errores y relanzarlos
// import { catchError, throwError } from 'rxjs';
// // Servicio de contador para cancelar los temporizadores activos de sesión
// import { ContadorService } from '../services/contador.service';
// // Token de contexto para omitir la intercepción cuando sea necesario
// import { SKIP_INTERCEPTOR } from './http-context-tokens';

// // Bandera global para evitar abrir múltiples modales si fallan varias peticiones simultáneas con 401
// let flagError401 = false;

// /**
//  * Interceptor funcional HTTP global de Angular.
//  */

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const router = inject(Router);
//   const auth = inject(AuthService);
//   const modal = inject(ModalService);
//   const contador = inject(ContadorService);

//   const reqConCookies = req.clone({ withCredentials: true });

//   // Rutas de autenticación que deben responder 401 sin disparar el modal de expiración
//   const esRutaSilenciosa =
//     req.url.includes('/auth/autorizar') ||
//     req.url.includes('/auth/login') ||
//     req.url.includes('/auth/registro');

//   if (req.context.get(SKIP_INTERCEPTOR) || esRutaSilenciosa) {
//     return next(reqConCookies);
//   }

//   return next(reqConCookies).pipe(
//     catchError((error: HttpErrorResponse) => {
//       if (error.status === 401) {
//         if (flagError401) {
//           return throwError(() => error);
//         }

//         flagError401 = true;
//         contador.limpiarTimers();
//         localStorage.removeItem('usuarioActual');
//         auth.actualUser.set(null);

//         router.navigate(['/login']).then(() => {
//           modal.alerta({
//             categoria: 'SESIÓN / EXPIRACIÓN',
//             titulo: 'Sesión expirada',
//             mensaje: 'Tu sesión ha vencido o no es válida. Por favor, ingresá nuevamente.',
//             textoConfirmar: 'Entendido',
//             esPeligro: true
//           }).then(() => {
//             flagError401 = false;
//           });
//         });
//       }

//       return throwError(() => error);
//     })
//   );
// };


