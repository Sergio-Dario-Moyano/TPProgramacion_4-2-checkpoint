// Importamos utilidades de componentes, señales y ciclo de vida de Angular
import { Component, inject, signal, computed } from '@angular/core';
// Importamos Router y RouterLink para redirección y navegación declarativa
import { Router, RouterLink } from '@angular/router';
// Importamos las clases necesarias para construir formularios reactivos y validaciones
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
// Importamos toSignal para transformar eventos del formulario en señales reactivas
import { toSignal } from '@angular/core/rxjs-interop';
// Importamos el servicio de autenticación para enviar el registro al backend
import { AuthService } from '../../core/services/auth.service';
// Importamos la interfaz del modelo de registro de usuario
import { IRegistroUsuario } from '../../core/models/auth.interface';
// Importamos el componente Spinner para estados de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
// Importamos la directiva personalizada para enfocar inputs
import { AutoFocusDirective } from '../../shared/directives/auto-focus.directive';

/**
 * Componente standalone que administra el formulario completo de registro de usuarios.
 */
@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, SpinnerComponent, AutoFocusDirective],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  // Inyectamos el servicio de autenticación
  private auth = inject(AuthService);
  // Inyectamos el enrutador de Angular
  private router = inject(Router);

  // Señal booleana que controla el spinner mientras el backend procesa el alta
  loading = signal<boolean>(false);

  // Señal que almacena mensajes de error devueltos por el servidor o validación
  errorMensaje = signal<string | null>(null);

  // Señal booleana para alternar visibilidad de la contraseña
  togglePassword = signal<boolean>(false);

  // Señal booleana para alternar visibilidad de la confirmación de contraseña
  togglePasswordRepeat = signal<boolean>(false);

  // Referencia al archivo físico de imagen seleccionado por el usuario
  archivoSeleccionado: File | null = null;

  // Señal que contiene la URL en base64 de la imagen para la previsualización inmediata
  previewFoto = signal<string | null>(null);

  // Inicialización del formulario reactivo con todas sus restricciones
  registroForm = new FormGroup(
    {
      // Nombre y apellido unificados en el input pero procesables de forma robusta
      nombreCompleto: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)+$')
        ]
      }),
      // Correo institucional o personal con dominios válidos
      correo: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@(gmail\\.com|hotmail\\.com|outlook\\.com|utn\\.edu\\.ar)$')
        ]
      }),
      // Alias de usuario único en el sistema
      nombreUsuario: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(15),
          Validators.pattern('^[a-zA-Z0-9_]+$')
        ]
      }),
      // Fecha de nacimiento para validar edad entre 13 y 100 años
      fechaNacimiento: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, this.validarFechaNacimiento.bind(this)]
      }),
      // Contraseña robusta (8 caracteres, 1 mayúscula y 1 número)
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
        ]
      }),
      // Confirmación de contraseña
      repetirPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      // Descripción breve con límite de 250 caracteres
      descripcion: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(250)]
      }),
      // Rol de la cuenta asignable por el usuario
      perfil: new FormControl<'usuario' | 'administrador'>('usuario', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: this.passwordsCoinciden.bind(this) }
  );

  // Transformamos el valor de la descripción en una señal para el contador en tiempo real
  descripcionSignal = toSignal(this.registroForm.controls.descripcion.valueChanges, { initialValue: '' });
  caracteresDescripcion = computed(() => this.descripcionSignal()?.length || 0);

  /**
   * Validador cruzado para asegurar que la contraseña y su repetición sean idénticas
   */
  passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
    const pass = control.get('password')?.value;
    const repetir = control.get('repetirPassword')?.value;
    return pass === repetir ? null : { passwordsNoCoinciden: true };
  }

  /**
   * Validador personalizado que restringe fechas futuras y edades fuera del rango 13-100 años
   */
  validarFechaNacimiento(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const fecha = new Date(control.value);
    const hoy = new Date();

    // No se permiten fechas en el futuro
    if (fecha > hoy) return { fechaFutura: true };

    // Cálculo exacto de años cumplidos
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = fecha.getMonth();
    const diaNacimiento = fecha.getDate();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }

    if (edad < 13) return { menorDeEdad: true };
    if (edad > 100) return { mayorDeEdad: true };

    return null;
  }

  /**
   * Alterna la visibilidad del campo password
   */
  togglePw(): void {
    this.togglePassword.update((v) => !v);
  }

  /**
   * Alterna la visibilidad del campo repetirPassword
   */
  togglePwRepeat(): void {
    this.togglePasswordRepeat.update((v) => !v);
  }

  /**
   * Comprueba si un control específico tiene un error y ha sido tocado
   */
  tieneError(controlName: keyof typeof this.registroForm.controls, errorName: string): boolean {
    const control = this.registroForm.controls[controlName];
    return !!control && control.touched && control.hasError(errorName);
  }

  /**
   * Getter booleano para el error de discrepancia de contraseñas
   */
  get passwordsNoCoinciden(): boolean {
    return (
      this.registroForm.controls.repetirPassword.touched &&
      this.registroForm.hasError('passwordsNoCoinciden')
    );
  }

  /**
   * Captura el archivo seleccionado en el explorador y genera su vista previa
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Verificamos formato JPG, PNG o WEBP
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.errorMensaje.set('Solo se permiten imágenes JPG, PNG o WEBP.');
        return;
      }

      // Verificamos límite de 5 MB
      if (file.size > 5 * 1024 * 1024) {
        this.errorMensaje.set('La imagen no puede superar los 5 MB.');
        return;
      }

      this.archivoSeleccionado = file;

      // Leemos la imagen como DataURL para la previsualización
      const reader = new FileReader();
      reader.onload = (e) => this.previewFoto.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  /**
   * Envía el formulario procesando la separación de nombres y armando el FormData
   */
  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.errorMensaje.set('Por favor, completá todos los campos correctamente.');
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMensaje.set(null);

    const val = this.registroForm.getRawValue();

    // Separamos el Nombre Completo en Nombre y Apellido para cumplir con el contrato del backend
    const partesNombre = val.nombreCompleto.trim().split(' ');
    const nombre = partesNombre[0];
    const apellido = partesNombre.slice(1).join(' ');

    // Construimos el FormData multipart para enviar los datos y la imagen a Cloudinary
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('apellido', apellido);
    formData.append('correo', val.correo);
    formData.append('nombreUsuario', val.nombreUsuario);
    formData.append('password', val.password);
    formData.append('repetirPassword', val.repetirPassword);
    formData.append('fechaNacimiento', val.fechaNacimiento);
    formData.append('descripcion', val.descripcion);
    formData.append('perfil', val.perfil);

    // Adjuntamos el archivo físico si fue cargado
    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }

    // Ejecutamos la petición HTTP hacia el backend
    this.auth.registro(formData).subscribe({
      next: () => {
        this.loading.set(false);
        // Redirigimos al usuario al login tras la creación exitosa
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.loading.set(false);
        const mensaje = err?.error?.message;
        this.errorMensaje.set(
          Array.isArray(mensaje)
            ? mensaje.join(' ')
            : mensaje ?? 'Hubo un error al registrar tu cuenta. Intentá de nuevo.'
        );
      }
    });
  }
}
