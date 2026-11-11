import { Component, DestroyRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { AuthService } from '../../../core/services/auth.service';
import { IUsuario, RolUsuario } from '../../../core/models/auth.interface';
import { ModalService } from '../../../shared/components/modal/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { FormularioUsuarioComponent } from '../../../shared/components/formulario-usuario/formulario-usuario.component';
import { ImagenFallbackDirective } from '../../../shared/directives/imagen-fallback.directive';
import { EdadPipe } from '../../../shared/pipes/edad.pipe';
import { TiempoRelativoPipe } from '../../../shared/pipes/tiempo-relativo.pipe';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

/**
 * Dashboard / Usuarios (Sprint 4, solo administradores).
 * - Listado de usuarios con búsqueda y filtro por estado.
 * - Alta de usuarios con los mismos datos del registro y radio buttons usuario / administrador.
 * - Baja lógica (deshabilitar) y alta lógica (habilitar).
 * - Cambio de rol de un usuario existente (usuario ↔ administrador).
 */
@Component({
  selector: 'app-dashboard-usuarios',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    SpinnerComponent,
    FormularioUsuarioComponent,
    ImagenFallbackDirective,
    EdadPipe,
    TiempoRelativoPipe
  ],
  templateUrl: './dashboard-usuarios.html',
  styleUrl: './dashboard-usuarios.css'
})
export class DashboardUsuarios implements OnInit {
  private usuariosService = inject(UsuariosService);
  private auth = inject(AuthService);
  private modal = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  private formulario = viewChild(FormularioUsuarioComponent);

  usuarios = signal<IUsuario[]>([]);
  cargando = signal(true);
  creando = signal(false);
  mostrarFormulario = signal(false);
  errorAlta = signal<string | null>(null);
  procesandoId = signal<string | null>(null);

  estado = signal<FiltroEstado>('todos');
  busqueda = new FormControl('', { nonNullable: true });

  idActual = computed(() => this.auth.actualUser()?._id);
  totales = computed(() => {
    const lista = this.usuarios();
    return {
      total: lista.length,
      activos: lista.filter((u) => u.activo).length,
      admins: lista.filter((u) => u.perfil === 'administrador').length
    };
  });

  ngOnInit(): void {
    this.cargar();
    this.busqueda.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());
  }

  cambiarEstado(estado: FiltroEstado): void {
    this.estado.set(estado);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar(this.busqueda.value, this.estado()).subscribe({
      next: (res) => {
        this.usuarios.set(res.usuarios);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // ---------------- Alta ----------------

  crearUsuario(formData: FormData): void {
    this.creando.set(true);
    this.errorAlta.set(null);

    this.usuariosService.crear(formData).subscribe({
      next: (res) => {
        this.creando.set(false);
        this.formulario()?.reiniciar();
        this.mostrarFormulario.set(false);
        this.cargar();
        this.modal.alerta({
          categoria: 'DASHBOARD / ALTA',
          titulo: 'Usuario creado',
          mensaje: `Se creó la cuenta de @${res.usuario.nombreUsuario} con perfil "${res.usuario.perfil}".`,
          textoConfirmar: 'Listo',
          tipoIcono: 'success',
          esPeligro: false
        });
      },
      error: (err: HttpErrorResponse) => {
        this.creando.set(false);
        const msg = err.error?.message;
        this.errorAlta.set(Array.isArray(msg) ? msg.join(' ') : msg ?? 'No se pudo crear el usuario.');
      }
    });
  }

  // ---------------- Baja / alta lógica ----------------

  async deshabilitar(usuario: IUsuario): Promise<void> {
    const ok = await this.modal.confirmar({
      categoria: 'DASHBOARD / BAJA LÓGICA',
      titulo: `¿Deshabilitar a @${usuario.nombreUsuario}?`,
      mensaje: 'No va a poder iniciar sesión hasta que lo vuelvas a habilitar. Al intentarlo verá un aviso de cuenta deshabilitada.',
      infoSecundaria: { titulo: `${usuario.nombre} ${usuario.apellido}`, subtitulo: usuario.correo },
      textoConfirmar: 'Deshabilitar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'alert',
      esPeligro: true
    });
    if (!ok) return;

    this.procesandoId.set(usuario._id);
    this.usuariosService.deshabilitar(usuario._id).subscribe({
      next: (res) => this.actualizarEnLista(res.usuario),
      error: (err: HttpErrorResponse) => this.errorAccion(err)
    });
  }

  habilitar(usuario: IUsuario): void {
    this.procesandoId.set(usuario._id);
    this.usuariosService.habilitar(usuario._id).subscribe({
      next: (res) => this.actualizarEnLista(res.usuario),
      error: (err: HttpErrorResponse) => this.errorAccion(err)
    });
  }

  // ---------------- Cambio de rol ----------------

  async cambiarRol(usuario: IUsuario): Promise<void> {
    if (!usuario.activo) return; // El botón ya está deshabilitado; el backend también lo rechaza (409)
    const nuevoRol: RolUsuario = usuario.perfil === 'administrador' ? 'usuario' : 'administrador';
    const haciaAdmin = nuevoRol === 'administrador';

    const ok = await this.modal.confirmar({
      categoria: 'DASHBOARD / CAMBIO DE ROL',
      titulo: haciaAdmin
        ? `¿Hacer administrador a @${usuario.nombreUsuario}?`
        : `¿Quitarle el rol de administrador a @${usuario.nombreUsuario}?`,
      mensaje: haciaAdmin
        ? 'Va a poder entrar al dashboard, gestionar usuarios, ver estadísticas y dar de baja cualquier publicación.'
        : 'Va a seguir usando la red social como usuario común, sin acceso al dashboard.',
      infoSecundaria: { titulo: `${usuario.nombre} ${usuario.apellido}`, subtitulo: usuario.correo },
      textoConfirmar: haciaAdmin ? 'Hacer administrador' : 'Quitar rol',
      textoCancelar: 'Cancelar',
      tipoIcono: 'alert',
      esPeligro: !haciaAdmin
    });
    if (!ok) return;

    this.procesandoId.set(usuario._id);
    this.usuariosService.cambiarRol(usuario._id, nuevoRol).subscribe({
      next: (res) => {
        this.procesandoId.set(null);
        this.usuarios.update((lista) => lista.map((u) => (u._id === res.usuario._id ? res.usuario : u)));
      },
      error: (err: HttpErrorResponse) => this.errorAccion(err)
    });
  }

  private actualizarEnLista(usuario: IUsuario): void {
    this.procesandoId.set(null);
    const filtro = this.estado();
    const sigueEnFiltro = filtro === 'todos' || (filtro === 'activos') === usuario.activo;
    this.usuarios.update((lista) =>
      sigueEnFiltro ? lista.map((u) => (u._id === usuario._id ? usuario : u)) : lista.filter((u) => u._id !== usuario._id)
    );
  }

  private errorAccion(err: HttpErrorResponse): void {
    this.procesandoId.set(null);
    if (err.status === 401 || err.status === 403) return; // Los maneja el interceptor
    this.modal.alerta({
      categoria: `DASHBOARD / ERROR ${err.status}`,
      titulo: 'No se pudo completar la acción',
      mensaje: err.error?.message ?? 'Intentá de nuevo.',
      textoConfirmar: 'Entendido',
      tipoIcono: 'alert',
      esPeligro: true
    });
  }
}
