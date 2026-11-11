import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { FormularioUsuarioComponent } from '../../shared/components/formulario-usuario/formulario-usuario.component';

/**
 * Registro (Sprint 1 y 3).
 * El formulario (validaciones, foto, perfil) vive en FormularioUsuarioComponent.
 * Al registrarse, el backend devuelve el token: se guarda y el usuario entra directo a publicaciones.
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, FormularioUsuarioComponent],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private auth = inject(AuthService);
  private router = inject(Router);
  private modalService = inject(ModalService);

  loading = signal(false);
  errorMensaje = signal<string | null>(null);

  registrar(formData: FormData): void {
    this.loading.set(true);
    this.errorMensaje.set(null);

    this.auth.registro(formData).subscribe({
      next: async (res) => {
        this.loading.set(false);
        this.auth.iniciarSesion(res);
        await this.router.navigate(['/publicaciones']);
        this.modalService.alerta({
          categoria: 'REGISTRO / NUEVO JUGADOR',
          titulo: `¡Bienvenido, @${res.usuario.nombreUsuario}!`,
          mensaje: 'Tu cuenta se creó correctamente. Ya podés publicar, comentar y dar me gusta.',
          textoConfirmar: '¡A jugar!',
          tipoIcono: 'success',
          esPeligro: false
        });
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.message;
        this.errorMensaje.set(
          err?.status === 0
            ? 'No pudimos conectar con el servidor. Probá de nuevo en unos segundos.'
            : Array.isArray(mensaje)
              ? mensaje.join(' ')
              : mensaje ?? 'No pudimos crear tu cuenta. Intentá de nuevo.'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
