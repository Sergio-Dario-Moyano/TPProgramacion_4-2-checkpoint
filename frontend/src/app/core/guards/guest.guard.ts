import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de login y registro.
 * Al entrar por primera vez también pasa por "cargando": si ya hay una sesión válida,
 * el usuario va directo a publicaciones.
 */
export const guestGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.sesionVerificada()) {
    return router.createUrlTree(['/cargando'], { queryParams: { destino: state.url } });
  }
  return auth.isAuthenticated() ? router.createUrlTree(['/publicaciones']) : true;
};


