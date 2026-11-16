import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de rutas privadas.
 * Si todavía no se verificó la sesión contra el backend (recién se abrió la app o se recargó la
 * página), manda a la pantalla "cargando" recordando a dónde quería ir el usuario.
 * Si no hay sesión, manda al login.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.sesionVerificada()) {
    return router.createUrlTree(['/cargando'], { queryParams: { destino: state.url } });
  }
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/** Guard del dashboard (Sprint 4): solo administradores. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.sesionVerificada()) {
    return router.createUrlTree(['/cargando'], { queryParams: { destino: state.url } });
  }
  if (!auth.isAuthenticated()) return router.createUrlTree(['/login']);
  return auth.esAdmin() ? true : router.createUrlTree(['/publicaciones']);
};


