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














// // Importamos la función de inyección de dependencias
// import { inject } from '@angular/core';
// // Importamos los tipos CanActivateFn y Router para guards funcionales
// import { CanActivateFn, Router } from '@angular/router';
// // Importamos el servicio de autenticación para consultar el Signal de sesión
// import { AuthService } from '../services/auth.service';

// /**
//  * Guard funcional que protege rutas exclusivas de miembros autenticados.
//  */
// export const authGuard: CanActivateFn = () => {
//   // Inyectamos el servicio de autenticación
//   const authService = inject(AuthService);
//   // Inyectamos el enrutador para redirigir si no está logueado
//   const router = inject(Router);

//   // Evaluamos si el usuario no tiene una sesión activa confirmada
//   if (!authService.isAuthenticated()) {
//     // Lo redirigimos a la pantalla de inicio de sesión
//     router.navigate(['/login']);
//     // Denegamos el acceso a la ruta solicitada
//     return false;
//   }

//   // Permitimos el acceso si la sesión es válida
//   return true;
// };
