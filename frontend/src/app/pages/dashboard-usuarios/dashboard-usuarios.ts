// Importamos utilidades de componentes, señales, computación e inyección de Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
// Importamos RouterLink y RouterLinkActive para la navegación del dashboard
import { RouterLink, RouterLinkActive } from '@angular/router';
// Importamos módulos de formularios reactivos y validadores
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
// Importamos el servicio administrativo de usuarios
import { UsuariosService } from '../../core/services/usuarios.service';
// Importamos el servicio de modales para confirmar cambios de estado
import { ModalService } from '../../shared/components/modal/modal.service';
// Importamos el modelo tipado de usuario
import { IUsuario } from '../../core/models/auth.interface';
// Importamos el componente Spinner para estados de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

/**
 * Componente standalone para la administración y moderación de cuentas de usuario.
 */
@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, SpinnerComponent],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css'
})
export class DashboardUsuarios implements OnInit {
  // Inyección de servicios
  private usuariosService = inject(UsuariosService);
  private modalService = inject(ModalService);

  // Signal que almacena la lista global de usuarios traída del backend
  usuarios = signal<IUsuario[]>([]);

  // Signals para estados de carga y errores
  loading = signal<boolean>(true);
  guardandoUsuario = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Signal booleana que controla si el acordeón de nuevo usuario está abierto o colapsado
  formularioAbierto = signal<boolean>(true);

  // Signals para visibilidad de contraseñas en el formulario de alta
  togglePassword = signal<boolean>(false);
  togglePasswordRepeat = signal<boolean>(false);

  // Signals para los filtros de búsqueda y estado
  filtroTexto = signal<string>('');
  filtroEstado = signal<'todos' | 'activos' | 'deshabilitados'>('todos');

  // Paginación interna de la tabla
  paginaActual = signal<number>(1);
  readonly elementosPorPagina = 6;

  // Manejo de archivo e imagen de perfil para el nuevo usuario
  archivoSeleccionado: File | null = null;
  previewFoto = signal<string | null>(null);

  // Formulario reactivo para dar de alta un usuario desde el panel
  nuevoUsuarioForm = new FormGroup(
    {
      nombreCompleto: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern('^[A-Za-zÁÉÍÓÚáéíóúÑñ]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñ]+)+$')
        ]
      }),
      correo: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.email,
          Validators.pattern('^[a-zA-Z0-9._%+-]+@(gmail\\.com|hotmail\\.com|outlook\\.com|utn\\.edu\\.ar)$')
        ]
      }),
      nombreUsuario: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(15),
          Validators.pattern('^[a-zA-Z0-9_]+$')
        ]
      }),
      fechaNacimiento: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, this.validarFechaNacimiento.bind(this)]
      }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)
        ]
      }),
      repetirPassword: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required]
      }),
      descripcion: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.maxLength(250)]
      }),
      perfil: new FormControl<'usuario' | 'administrador'>('usuario', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: this.passwordsCoinciden.bind(this) }
  );

  // Métricas computadas sobre el padrón total
  totalCuentas = computed(() => this.usuarios().length);
  totalActivos = computed(() => this.usuarios().filter((u) => u.activo).length);
  totalDeshabilitados = computed(() => this.usuarios().filter((u) => !u.activo).length);

  // Signal computada que aplica los filtros de texto y estado reactivamente
  usuariosFiltrados = computed(() => {
    const texto = this.filtroTexto().toLowerCase().trim();
    const estado = this.filtroEstado();

    return this.usuarios().filter((u) => {
      // Coincidencia con nombre, apellido, usuario o correo
      const coincideTexto =
        !texto ||
        u.nombre.toLowerCase().includes(texto) ||
        u.apellido.toLowerCase().includes(texto) ||
        u.nombreUsuario.toLowerCase().includes(texto) ||
        u.correo.toLowerCase().includes(texto);

      // Coincidencia con estado activo o deshabilitado
      const coincideEstado =
        estado === 'todos' ||
        (estado === 'activos' && u.activo) ||
        (estado === 'deshabilitados' && !u.activo);

      return coincideTexto && coincideEstado;
    });
  });

  // Signal computada para la porción de usuarios correspondiente a la página actual
  usuariosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.usuariosFiltrados().slice(inicio, fin);
  });

  // Total de páginas calculadas
  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.usuariosFiltrados().length / this.elementosPorPagina))
  );

  ngOnInit(): void {
    // Al montar el dashboard, listamos todos los usuarios registrados
    this.cargarUsuarios();
  }

  /**
   * Consulta al backend la lista completa de usuarios
   */
  cargarUsuarios(): void {
    this.loading.set(true);
    this.usuariosService.listarTodos().subscribe({
      next: (res) => {
        this.usuarios.set(res.usuarios || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  /**
   * Alterna la visibilidad del acordeón del formulario
   */
  toggleAcordeon(): void {
    this.formularioAbierto.update((v) => !v);
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePw(): void {
    this.togglePassword.update((v) => !v);
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  togglePwRepeat(): void {
    this.togglePasswordRepeat.update((v) => !v);
  }

  /**
   * Validador cruzado de igualdad de contraseñas
   */
  passwordsCoinciden(control: AbstractControl): ValidationErrors | null {
    const pass = control.get('password')?.value;
    const repetir = control.get('repetirPassword')?.value;
    return pass === repetir ? null : { passwordsNoCoinciden: true };
  }

  /**
   * Validador de rango de edad 13-100 años
   */
  validarFechaNacimiento(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    const hoy = new Date();
    if (fecha > hoy) return { fechaFutura: true };

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }
    if (edad < 13) return { menorDeEdad: true };
    if (edad > 100) return { mayorDeEdad: true };
    return null;
  }

  /**
   * Comprueba errores en controles tocados
   */
  tieneError(controlName: keyof typeof this.nuevoUsuarioForm.controls, errorName: string): boolean {
    const c = this.nuevoUsuarioForm.controls[controlName];
    return !!c && c.touched && c.hasError(errorName);
  }

  get passwordsNoCoinciden(): boolean {
    return (
      this.nuevoUsuarioForm.controls.repetirPassword.touched &&
      this.nuevoUsuarioForm.hasError('passwordsNoCoinciden')
    );
  }

  /**
   * Captura y procesa la foto seleccionada para el nuevo usuario
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.errorMensaje.set('La imagen supera el límite de 5 MB.');
        return;
      }
      this.archivoSeleccionado = file;

      const reader = new FileReader();
      reader.onload = (e) => this.previewFoto.set(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  /**
   * Envía el formulario para crear un nuevo usuario desde el panel
   */
  onSubmitCrearUsuario(): void {
    if (this.nuevoUsuarioForm.invalid) {
      this.errorMensaje.set('Revisá los campos obligatorios del formulario.');
      this.nuevoUsuarioForm.markAllAsTouched();
      return;
    }

    this.guardandoUsuario.set(true);
    this.errorMensaje.set(null);

    const val = this.nuevoUsuarioForm.getRawValue();
    const partes = val.nombreCompleto.trim().split(' ');
    const nombre = partes[0];
    const apellido = partes.slice(1).join(' ');

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

    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }

    this.usuariosService.crearUsuario(formData).subscribe({
      next: (res) => {
        this.guardandoUsuario.set(false);
        this.nuevoUsuarioForm.reset({ perfil: 'usuario' });
        this.previewFoto.set(null);
        this.archivoSeleccionado = null;

        // Si el backend devuelve el nuevo usuario, lo agregamos a la lista
        if (res.usuario) {
          this.usuarios.update((list) => [res.usuario, ...list]);
        } else {
          this.cargarUsuarios();
        }
      },
      error: (err) => {
        this.guardandoUsuario.set(false);
        const msg = err?.error?.message;
        this.errorMensaje.set(Array.isArray(msg) ? msg.join(' ') : msg ?? 'Error al crear usuario.');
      }
    });
  }

  /**
   * Cancela y resetea el formulario de alta
   */
  cancelarFormulario(): void {
    this.nuevoUsuarioForm.reset({ perfil: 'usuario' });
    this.previewFoto.set(null);
    this.archivoSeleccionado = null;
    this.errorMensaje.set(null);
    this.formularioAbierto.set(false);
  }

  /**
   * Ejecuta la baja o alta lógica de un usuario tras confirmación en modal
   */
  async cambiarEstadoUsuario(usuario: IUsuario): Promise<void> {
    const accion = usuario.activo ? 'deshabilitar' : 'habilitar';
    const titulo = usuario.activo ? 'Deshabilitar cuenta' : 'Habilitar cuenta';
    const mensaje = usuario.activo
      ? `¿Estás seguro de que deseas deshabilitar la cuenta de @${usuario.nombreUsuario}? El usuario no podrá iniciar sesión.`
      : `¿Estás seguro de que deseas reactivar la cuenta de @${usuario.nombreUsuario}? El usuario podrá volver a ingresar.`;

    const confirmado = await this.modalService.confirmar({
      categoria: 'MODERACIÓN / USUARIOS',
      titulo,
      mensaje,
      textoConfirmar: usuario.activo ? 'Deshabilitar' : 'Habilitar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'alert',
      esPeligro: usuario.activo
    });

    if (confirmado) {
      if (usuario.activo) {
        // Baja lógica
        this.usuariosService.deshabilitar(usuario._id).subscribe({
          next: () => {
            this.usuarios.update((list) =>
              list.map((u) => (u._id === usuario._id ? { ...u, activo: false } : u))
            );
          }
        });
      } else {
        // Alta lógica
        this.usuariosService.habilitar(usuario._id).subscribe({
          next: () => {
            this.usuarios.update((list) =>
              list.map((u) => (u._id === usuario._id ? { ...u, activo: true } : u))
            );
          }
        });
      }
    }
  }

  /**
   * Cambia la página activa de la tabla
   */
  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual.set(p);
    }
  }

  /**
   * Genera las iniciales para el avatar cuando no hay foto cargada
   */
  obtenerIniciales(u: IUsuario): string {
    const n = u.nombre?.[0] || '';
    const a = u.apellido?.[0] || '';
    return (n + a).toUpperCase() || 'U';
  }
}
