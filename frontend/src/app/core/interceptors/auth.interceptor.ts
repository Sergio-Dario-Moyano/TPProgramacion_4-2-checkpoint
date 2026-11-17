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



