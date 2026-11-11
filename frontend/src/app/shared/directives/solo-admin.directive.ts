import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

/**
 * Directiva estructural propia: *appSoloAdmin (Sprint 4).
 * Muestra el contenido solo si el usuario logueado tiene perfil "administrador".
 * Reacciona sola a los cambios de sesión (login, logout, cambio de usuario).
 * Uso: <a *appSoloAdmin routerLink="/dashboard/usuarios">Dashboard</a>
 */
@Directive({
  selector: '[appSoloAdmin]',
  standalone: true
})
export class SoloAdminDirective {
  private auth = inject(AuthService);
  private template = inject(TemplateRef<unknown>);
  private contenedor = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.esAdmin();
      if (esAdmin && !this.visible) {
        this.contenedor.createEmbeddedView(this.template);
        this.visible = true;
      } else if (!esAdmin && this.visible) {
        this.contenedor.clear();
        this.visible = false;
      }
    });
  }
}
