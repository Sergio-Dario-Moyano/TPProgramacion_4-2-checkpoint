
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ILogin } from '../../core/models/auth.interface';

/**
 * Componente standalone que gestiona el inicio de sesión (Sprint 1 y 3).
 * Qué hace: Recibe usuario/correo y contraseña, valida el formato, inicia sesión en el backend, enciende el temporizador de 10 min y redirige a publicaciones.
 * Cómo lo hace: Emplea FormGroup con validaciones, llama a auth.login() y si es exitoso activa contadorService.iniciarTemporizador()
 * y router.navigate(['/publicaciones']). Mientras espera la respuesta, el template muestra la pantalla de carga con el logo.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, LogoComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  togglePassword = signal<boolean>(false);

  loginForm = new FormGroup({
    credencial: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
      ]
    })
  });

  togglePw(): void {
    this.togglePassword.update((visible) => !visible);
  }

  tieneError(controlName: keyof typeof this.loginForm.controls, errorName: string): boolean {
    const control = this.loginForm.controls[controlName];
    return !!control && control.touched && control.hasError(errorName);
  }

  /**
   * Procesa el envío del formulario de inicio de sesión.
   * Qué hace: Envía credenciales al backend y maneja mensajes de error específicos (ej. cuenta deshabilitada).
   * Cómo lo hace: Llama a auth.login() con los valores del formulario; guarda el usuario, inicia el temporizador y navega a publicaciones.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMensaje.set('Por favor, completá los campos correctamente antes de continuar.');
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMensaje.set(null);

    const credenciales: ILogin = this.loginForm.getRawValue();
    const inicio = Date.now();
    const DURACION_MINIMA_MS = 1200;

    // Ejecuta la acción cuando ya pasaron al menos 3 segundos desde el envío
    const despuesDelMinimo = (accion: () => void) => {
      const restante = Math.max(0, DURACION_MINIMA_MS - (Date.now() - inicio));
      setTimeout(accion, restante);
    };

    this.auth.login(credenciales).subscribe({
      next: (res) => {
        despuesDelMinimo(() => {
          // Guarda el token localmente, carga el usuario y arranca el contador de 15 minutos
          this.auth.iniciarSesion(res);
          this.loading.set(false);
          this.router.navigate(['/publicaciones']);
        });
      },
      error: (err: any) => {
        const mensajeBackend = err?.error?.message;
        let textoError = 'Usuario o contraseña incorrectos.';

        if (err?.status === 0) {
          textoError = 'No pudimos conectar con el servidor. Probá de nuevo en unos segundos.';
        } else if (Array.isArray(mensajeBackend)) {
          textoError = mensajeBackend.join(' ');
        } else if (mensajeBackend) {
          // 401: credenciales inválidas o cuenta deshabilitada (el backend explica cuál)
          textoError = mensajeBackend;
        }

        despuesDelMinimo(() => {
          this.loading.set(false);
          this.errorMensaje.set(textoError);
        });
      }
    });
  }
}
