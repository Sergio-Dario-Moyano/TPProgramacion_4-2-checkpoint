import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Al abrir la app siempre se pasa por la pantalla "cargando" (Sprint 3)
  { path: '', pathMatch: 'full', redirectTo: 'cargando' },
  {
    path: 'cargando',
    title: 'Cargando · Checkpoint',
    loadComponent: () => import('./pages/pantalla-cargando/pantalla-cargando').then((m) => m.PantallaCargando)
  },

  // Rutas públicas
  {
    path: 'login',
    title: 'Ingresar · Checkpoint',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login)
  },
  {
    path: 'registro',
    title: 'Crear cuenta · Checkpoint',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro)
  },

  // Rutas privadas
  {
    path: 'publicaciones',
    title: 'Publicaciones · Checkpoint',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/publicaciones/publicaciones').then((m) => m.Publicaciones)
  },
  {
    path: 'publicaciones/:id',
    title: 'Publicación · Checkpoint',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/publicacion-detalle/publicacion-detalle').then((m) => m.PublicacionDetalle)
  },
  {
    path: 'mi-perfil',
    title: 'Mi perfil · Checkpoint',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/mi-perfil/mi-perfil').then((m) => m.MiPerfil)
  },

  // Dashboard (Sprint 4): solo administradores
  {
    path: 'dashboard',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'usuarios' },
      {
        path: 'usuarios',
        title: 'Usuarios · Dashboard',
        loadComponent: () => import('./pages/dashboard/usuarios/dashboard-usuarios').then((m) => m.DashboardUsuarios)
      },
      {
        path: 'estadisticas',
        title: 'Estadísticas · Dashboard',
        loadComponent: () =>
          import('./pages/dashboard/estadisticas/dashboard-estadisticas').then((m) => m.DashboardEstadisticas)
      }
    ]
  },

  { path: '**', redirectTo: 'cargando' }
];
