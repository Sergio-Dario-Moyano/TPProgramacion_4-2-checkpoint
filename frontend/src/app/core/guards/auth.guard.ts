// Importamos la función de inyección de dependencias
import { inject } from '@angular/core';
// Importamos los tipos CanActivateFn y Router para guards funcionales
import { CanActivateFn, Router } from '@angular/router';
// Importamos el servicio de autenticación para consultar el Signal de sesión
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional que protege rutas exclusivas de miembros autenticados.
 */
export const authGuard: CanActivateFn = () => {
  // Inyectamos el servicio de autenticación
  const authService = inject(AuthService);
  // Inyectamos el enrutador para redirigir si no está logueado
  const router = inject(Router);

  // Evaluamos si el usuario no tiene una sesión activa confirmada
  if (!authService.isAuthenticated()) {
    // Lo redirigimos a la pantalla de inicio de sesión
    router.navigate(['/login']);
    // Denegamos el acceso a la ruta solicitada
    return false;
  }

  // Permitimos el acceso si la sesión es válida
  return true;
};
