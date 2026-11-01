// Inyección de dependencias y tipos de rutas funcionales
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
// Servicio de autenticación para leer los datos del usuario logueado
import { AuthService } from '../services/auth.service';
// Servicio de modal para mostrar advertencia visual ante accesos no autorizados
import { ModalService } from '../../shared/components/modal/modal.service';

/**
 * Guard funcional que verifica que el usuario autenticado posea el rol de administrador.
 */
export const adminGuard: CanActivateFn = () => {
  // Inyectamos el servicio de autenticación
  const authService = inject(AuthService);
  // Inyectamos el enrutador
  const router = inject(Router);
  // Inyectamos el modal del sistema
  const modalService = inject(ModalService);

  // Obtenemos el objeto de usuario actual desde el Signal reactivo
  const user = authService.actualUser();

  // Comprobamos si el usuario existe y si su atributo perfil es exactamente 'administrador'
  if (user && user.perfil === 'administrador') {
    // Concedemos el acceso al panel administrativo
    return true;
  }

  // Si no es administrador, alertamos mediante el modal de la aplicación
  modalService.alerta({
    categoria: 'SEGURIDAD / ACCESO RESTRINGIDO',
    titulo: 'Acceso denegado',
    mensaje: 'No tenés permisos de administrador para ingresar a esta sección.',
    textoConfirmar: 'Volver',
    esPeligro: true
  });

  // Redirigimos al usuario regular al feed de publicaciones
  router.navigate(['/publicaciones']);
  // Bloqueamos la entrada a la ruta protegida
  return false;
};
