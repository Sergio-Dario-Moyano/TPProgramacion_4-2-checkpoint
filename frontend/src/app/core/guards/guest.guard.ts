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
















// // Inyección de dependencias y tipos de rutas
// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// // Servicio de autenticación para comprobar la sesión
// import { AuthService } from '../services/auth.service';

// /**
//  * Guard funcional para rutas públicas que solo deben ver usuarios invitados o no logueados.
//  */
// export const guestGuard: CanActivateFn = () => {
//   // Inyectamos el servicio de autenticación
//   const authService = inject(AuthService);
//   // Inyectamos el enrutador de Angular
//   const router = inject(Router);

//   // Si el usuario ya está autenticado en la plataforma
//   if (authService.isAuthenticated()) {
//     // Lo reenviamos al feed de publicaciones
//     router.navigate(['/publicaciones']);
//     // Bloqueamos el reingreso al formulario de login o registro
//     return false;
//   }

//   // Permitimos la navegación si es un visitante anónimo
//   return true;
// };
