// Importamos utilidades de componentes, inyección y reactividad por Signals de Angular
import { Component, inject, signal } from '@angular/core';
// Importamos Router y RouterLink para redirección y navegación declarativa
import { Router, RouterLink } from '@angular/router';
// Importamos las clases necesarias para construir formularios reactivos y validaciones
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// Importamos el servicio de autenticación
import { AuthService } from '../../core/services/auth.service';
// Importamos el servicio del contador para arrancar los timers de sesión
import { ContadorService } from '../../core/services/contador.service';
// Importamos la interfaz tipada para el payload de login
import { ILogin } from '../../core/models/auth.interface';
// Importamos el componente Spinner para el estado de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

/**
 * Componente standalone que gestiona la pantalla y el flujo de inicio de sesión.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  // Inyectamos el servicio de autenticación
  private auth = inject(AuthService);
  // Inyectamos el servicio de enrutamiento
  private router = inject(Router);
  // Inyectamos el servicio del temporizador de inactividad
  private contadorService = inject(ContadorService);

  // Signal booleana que controla el spinner de espera durante la autenticación
  loading = signal<boolean>(false);

  // Signal que contiene el mensaje de error para desplegar el cuadro rojo de advertencia
  errorMensaje = signal<string | null>(null);

  // Signal booleana para alternar la visibilidad de la contraseña (texto plano u oculta)
  togglePassword = signal<boolean>(false);

  // Inicialización del formulario reactivo con validaciones requeridas por la consigna
  loginForm = new FormGroup({
    // Campo para correo electrónico o nombre de usuario (mínimo 3 caracteres)
    credencial: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    // Campo de contraseña (mínimo 8 caracteres, al menos una mayúscula y un número)
    password: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
      ]
    })
  });

  /**
   * Alterna el estado de visibilidad del texto de la contraseña
   */
  togglePw(): void {
    this.togglePassword.update((visible) => !visible);
  }

  /**
   * Determina si un campo específico fue tocado y posee un error de validación concreto
   */
  tieneError(controlName: keyof typeof this.loginForm.controls, errorName: string): boolean {
    const control = this.loginForm.controls[controlName];
    return !!control && control.touched && control.hasError(errorName);
  }

  /**
   * Manejador de envío del formulario
   */
  onSubmit(): void {
    // Si el formulario contiene campos inválidos, marcamos todo como tocado y alertamos
    if (this.loginForm.invalid) {
      this.errorMensaje.set('Por favor, completá los campos correctamente antes de continuar.');
      this.loginForm.markAllAsTouched();
      return;
    }

    // Activamos el estado de carga y limpiamos errores previos
    this.loading.set(true);
    this.errorMensaje.set(null);

    // Extraemos los valores del formulario tipados según la interfaz ILogin
    const credenciales: ILogin = this.loginForm.getRawValue();

    // Invocamos el endpoint de login en el backend
    this.auth.login(credenciales).subscribe({
      next: (res: any) => {
        // Desactivamos el spinner
        this.loading.set(false);
        // Persistimos los datos del usuario en memoria reactiva y localStorage
        this.auth.setUsuarioActual(res.usuario);
        // Iniciamos el temporizador de inactividad de 10 minutos
        this.contadorService.iniciarTemporizador();
        // Redirigimos al usuario al feed principal
        this.router.navigate(['/publicaciones']);
      },
      error: (err: any) => {
        // Desactivamos el spinner ante una falla
        this.loading.set(false);

        // Obtenemos el mensaje retornado por el backend
        const mensajeBackend = err?.error?.message;

        // Si la cuenta está deshabilitada (baja lógica), mostramos el mensaje de la captura
        if (typeof mensajeBackend === 'string' && mensajeBackend.toLowerCase().includes('bloqueada')) {
          this.errorMensaje.set('Tu cuenta ha sido deshabilitada. Contactá al administrador.');
        } else if (Array.isArray(mensajeBackend)) {
          // Si el backend responde con un arreglo de errores de validación
          this.errorMensaje.set(mensajeBackend.join(' '));
        } else {
          // Mensaje por defecto para credenciales inválidas
          this.errorMensaje.set(mensajeBackend ?? 'Credenciales incorrectas. Verificá los datos ingresados.');
        }
      }
    });
  }
}
