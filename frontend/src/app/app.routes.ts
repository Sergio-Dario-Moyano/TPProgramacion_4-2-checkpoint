// Importamos el tipo Routes de Angular
import { Routes } from '@angular/router';
// Importamos los guards de protección perimetral
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

/**
 * Tabla de rutas standalone de UTN-BUGS.
 */
export const routes: Routes = [
  // Ruta inicial: pantalla de verificación silenciosa de sesión
  {
    path: '',
    loadComponent: () =>
      import('./pages/pantalla-cargando/pantalla-cargando').then((m) => m.PantallaCargando)
  },

  // Ruta pública: Login (protegida con guestGuard para no reingresar si ya está logueado)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login)
  },

  // Ruta pública: Registro (protegida con guestGuard)
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro)
  },

  // Ruta privada: Feed de publicaciones
  {
    path: 'publicaciones',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones)
  },

  // Ruta privada: Detalle de publicación con hilo de comentarios
  {
    path: 'publicaciones/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle)
  },

  // Ruta privada: Mi Perfil (datos personales y últimas 3 publicaciones)
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil)
  },

  // Rutas de administración (protegidas con authGuard y adminGuard)
  {
    path: 'dashboard/usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/dashboard-usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios)
  },
  {
    path: 'dashboard/estadisticas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./pages/dashboard-estadisticas/dashboard-estadisticas').then((m) => m.DashboardEstadisticas)
  },

  // Comodín de rutas no encontradas: redirige a la raíz
  {
    path: '**',
    redirectTo: ''
  }
];
