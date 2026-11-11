import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { RolUsuario } from '../../../core/models/auth.interface';
import { crearVerificadorCoincidencia } from '../../utils/coincidencia-password';
import { SoltarArchivoDirective } from '../../directives/soltar-archivo.directive';
import { AutoResizeDirective } from '../../directives/auto-resize.directive';

const SOLO_LETRAS = '^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$';
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANO_MAXIMO_IMAGEN = 5 * 1024 * 1024;

/** Valida edad entre 13 y 100 años y que la fecha no sea futura. */
export function validarFechaNacimiento(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const [anio, mes, dia] = (control.value as string).split('-').map(Number);
  const hoy = new Date();
  const anioHoy = hoy.getFullYear();
  const mesHoy = hoy.getMonth() + 1;
  const diaHoy = hoy.getDate();

  if (anio > anioHoy || (anio === anioHoy && (mes > mesHoy || (mes === mesHoy && dia > diaHoy)))) {
    return { fechaFutura: true };
  }

  let edad = anioHoy - anio;
  if (mesHoy < mes || (mesHoy === mes && diaHoy < dia)) edad--;
  if (edad < 13) return { menorDeEdad: true };
  if (edad > 100) return { mayorDeEdad: true };
  return null;
}

/** Valida a nivel formulario que las dos contraseñas sean iguales (se usa al enviar). */
export function passwordsCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const pass = grupo.get('password')?.value;
  const repetir = grupo.get('repetirPassword')?.value;
  return pass === repetir ? null : { passwordsNoCoinciden: true };
}

/**
 * Formulario de alta de usuario.
 * Lo comparten la pantalla de Registro (Sprint 1) y el Dashboard de usuarios (Sprint 4),
 * que pide "los mismos datos que el registro".
 * Emite un FormData listo para enviar al backend.
 */
@Component({
  selector: 'app-formulario-usuario',
  standalone: true,
  imports: [ReactiveFormsModule, AutoResizeDirective, SoltarArchivoDirective],
  templateUrl: './formulario-usuario.component.html',
  styleUrl: './formulario-usuario.component.css'
})
export class FormularioUsuarioComponent {
  private destroyRef = inject(DestroyRef);

  /** Texto del botón principal. */
  textoBoton = input<string>('Crear cuenta');
  textoCargando = input<string>('Creando cuenta...');
  cargando = input<boolean>(false);
  /**
   * Muestra los radio buttons de perfil (usuario / administrador).
   * Solo el dashboard los muestra: en el registro público la cuenta siempre es "usuario".
   */
  mostrarPerfil = input<boolean>(true);

  enviar = output<FormData>();

  errorLocal = signal<string | null>(null);
  verPassword = signal(false);
  verRepetir = signal(false);
  archivoSeleccionado: File | null = null;
  previewFoto = signal<string | null>(null);

  form = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(SOLO_LETRAS)]
      }),
      apellido: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(SOLO_LETRAS)]
      }),
      correo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      nombreUsuario: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern('^[a-zA-Z0-9_]+$')]
      }),
      fechaNacimiento: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, validarFechaNacimiento]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)]
      }),
      repetirPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
      perfil: new FormControl<RolUsuario>('usuario', { nonNullable: true, validators: [Validators.required] })
    },
    { validators: passwordsCoinciden }
  );

  /** Estado de "repetir contraseña": solo informa cuando el usuario terminó de escribir. */
  coincidencia = crearVerificadorCoincidencia(
    this.form.controls.password,
    this.form.controls.repetirPassword,
    this.destroyRef
  );

  private descripcion = toSignal(this.form.controls.descripcion.valueChanges, { initialValue: '' });
  caracteresDescripcion = computed(() => this.descripcion()?.length ?? 0);

  tieneError(campo: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.hasError(error);
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.touched && control.invalid;
  }

  onFileSelected(event: Event): void {
    const inputArchivo = event.target as HTMLInputElement;
    const file = inputArchivo.files?.[0];
    inputArchivo.value = '';
    if (file) this.cargarFoto(file);
  }

  /** Valida y carga la imagen, elegida con el botón o soltada con arrastrar y soltar. */
  cargarFoto(file: File): void {

    if (!TIPOS_IMAGEN.includes(file.type)) {
      this.errorLocal.set('La foto debe ser JPG, PNG o WEBP.');
      return;
    }
    if (file.size > TAMANO_MAXIMO_IMAGEN) {
      this.errorLocal.set('La foto no puede superar los 5 MB.');
      return;
    }

    this.errorLocal.set(null);
    this.archivoSeleccionado = file;
    const reader = new FileReader();
    reader.onload = (e) => this.previewFoto.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  quitarFoto(event: Event): void {
    event.stopPropagation();
    this.archivoSeleccionado = null;
    this.previewFoto.set(null);
  }

  onSubmit(): void {
    this.coincidencia.confirmarAhora();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorLocal.set(
        this.form.hasError('passwordsNoCoinciden')
          ? 'Las contraseñas no coinciden.'
          : 'Revisá los campos marcados antes de continuar.'
      );
      return;
    }

    this.errorLocal.set(null);
    const v = this.form.getRawValue();
    const formData = new FormData();
    formData.append('nombre', v.nombre.trim());
    formData.append('apellido', v.apellido.trim());
    formData.append('correo', v.correo.trim());
    formData.append('nombreUsuario', v.nombreUsuario.trim());
    formData.append('password', v.password);
    formData.append('repetirPassword', v.repetirPassword);
    formData.append('fechaNacimiento', v.fechaNacimiento);
    formData.append('descripcion', v.descripcion.trim());
    // Sin radio buttons (registro público) no se envía: el backend asigna "usuario"
    if (this.mostrarPerfil()) formData.append('perfil', v.perfil);
    if (this.archivoSeleccionado) formData.append('file', this.archivoSeleccionado);

    this.enviar.emit(formData);
  }

  /** Deja el formulario vacío (se usa después de crear un usuario desde el dashboard). */
  reiniciar(): void {
    this.form.reset({ perfil: 'usuario' });
    this.archivoSeleccionado = null;
    this.previewFoto.set(null);
    this.errorLocal.set(null);
    this.coincidencia.reiniciar();
  }
}
