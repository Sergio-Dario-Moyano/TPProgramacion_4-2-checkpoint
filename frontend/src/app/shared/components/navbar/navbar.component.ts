// Importamos utilidades reactivas y de inyección
import { Component, computed, inject, signal } from '@angular/core';
// Importamos directivas de navegación por rutas
import { RouterLink, RouterLinkActive } from '@angular/router';
// Importamos el servicio de autenticación para consultar el usuario actual
import { AuthService } from '../../../core/services/auth.service';

/**
 * Constante del rol con privilegios de administrador para comparación
 */
const PERFIL_ADMIN = 'administrador';

/**
 * Barra de navegación principal y drawer lateral responsive.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // Inyectamos el servicio de autenticación
  authService = inject(AuthService);

  // Leemos la Signal del usuario autenticado
  usuario = this.authService.actualUser;

  // Signal booleana que controla la visibilidad del drawer mobile
  menuAbierto = signal<boolean>(false);

  // Signal calculada que determina si el usuario logueado tiene perfil de administrador
  esAdmin = computed(() => this.usuario()?.perfil === PERFIL_ADMIN);

  /**
   * Alterna la apertura y cierre del menú drawer en pantallas móviles
   */
  toggleMenu(): void {
    this.menuAbierto.update((estado) => !estado);
  }

  /**
   * Cierra el drawer al seleccionar una ruta o hacer clic fuera
   */
  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  /**
   * Cierra la sesión activa del usuario y oculta el drawer
   */
  cerrarSesion(): void {
    this.cerrarMenu();
    this.authService.logout();
  }
}
