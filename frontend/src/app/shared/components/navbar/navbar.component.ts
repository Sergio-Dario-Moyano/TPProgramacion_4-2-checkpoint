import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ModalService } from '../modal/modal.service';
import { LogoComponent } from '../logo/logo.component';
import { SoloAdminDirective } from '../../directives/solo-admin.directive';
import { ImagenFallbackDirective } from '../../directives/imagen-fallback.directive';

/**
 * Barra de navegación superior y drawer lateral responsive para la comunidad.
 * Qué hace: Permite navegar entre 'Publicaciones' y 'Mi Perfil', y gestionar el cierre de sesión.
 * Cómo lo hace: Lee el usuario en sesión desde AuthService y maneja el estado del menú drawer móvil con un Signal booleano.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, SoloAdminDirective, ImagenFallbackDirective],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  authService = inject(AuthService);
  modalService = inject(ModalService);
  usuario = this.authService.actualUser;

  menuAbierto = signal<boolean>(false);

  /**
   * Alterna la visibilidad del drawer móvil.
   * Qué hace: Abre o cierra el panel lateral en resoluciones pequeñas.
   * Cómo lo hace: Invoca menuAbierto.update() invirtiendo el valor actual.
   */
  toggleMenu(): void {
    this.menuAbierto.update((estado) => !estado);
  }

  /**
   * Cierra el menú drawer.
   * Qué hace: Oculta el panel al hacer clic en un enlace o en el backdrop.
   * Cómo lo hace: Establece menuAbierto en false.
   */
  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }


    /**
   * Cierra la sesión activa previa confirmación.
   * Qué hace: Cierra el drawer móvil, pregunta al usuario si quiere salir y, si acepta, destruye las credenciales.
   * Cómo lo hace: Abre modalService.confirmar() y solo si resuelve en true llama a authService.logout().
   */
  async cerrarSesion(): Promise<void> {
    this.cerrarMenu();

    const confirmado = await this.modalService.confirmar({
      categoria: 'SESIÓN / CIERRE',
      titulo: '¿Salir del juego?',
      mensaje: 'Vas a salir de tu cuenta. Para volver vas a tener que iniciar sesión de nuevo.',
      textoConfirmar: 'Cerrar sesión',
      textoCancelar: 'Cancelar',
      tipoIcono: 'logout',
      esPeligro: false
    });

    if (confirmado) {
      this.authService.logout();
    }
  }
}