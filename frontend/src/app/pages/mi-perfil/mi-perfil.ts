import { Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import { IPublicacion } from '../../core/models/publicacion.interface';
import { IComentario } from '../../core/models/comentario.interface';
import { aplicarMeGusta, yaDioMeGusta } from '../../core/utils/me-gusta';
import { PublicacionCardComponent } from '../publicaciones/components/publicacion-card/publicacion-card.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { EditorPublicacionComponent } from '../../shared/components/editor-publicacion/editor-publicacion.component';
import {
  TAMANO_MAXIMO_IMAGEN,
  TIPOS_IMAGEN,
  validarFechaNacimiento
} from '../../shared/components/formulario-usuario/formulario-usuario.component';
import { crearVerificadorCoincidencia } from '../../shared/utils/coincidencia-password';
import { EdadPipe } from '../../shared/pipes/edad.pipe';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { ImagenFallbackDirective } from '../../shared/directives/imagen-fallback.directive';
import { SoltarArchivoDirective } from '../../shared/directives/soltar-archivo.directive';
import { AutoResizeDirective } from '../../shared/directives/auto-resize.directive';

const SOLO_LETRAS = '^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$';

/**
 * Mi Perfil (Sprint 1 y 2 + perfil editable).
 * - Muestra todos los datos del usuario y su foto.
 * - Permite editar datos y foto (PUT /usuarios/perfil) y cambiar la contraseña.
 * - Muestra las últimas 3 publicaciones propias con sus comentarios.
 */
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    PublicacionCardComponent,
    SpinnerComponent,
    EditorPublicacionComponent,
    EdadPipe,
    TiempoRelativoPipe,
    ImagenFallbackDirective,
    AutoResizeDirective,
    SoltarArchivoDirective
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfil implements OnInit {
  private auth = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private usuariosService = inject(UsuariosService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  usuarioActual = computed(() => this.auth.actualUser());

  // ---------------- Publicaciones ----------------
  ultimasPublicaciones = signal<IPublicacion[]>([]);
  comentariosPorPost = signal<Record<string, IComentario[]>>({});
  totalPublicaciones = signal(0);
  loading = signal(true);
  publicacionEditando = signal<IPublicacion | null>(null);

  // ---------------- Edición de perfil ----------------
  modo = signal<'ver' | 'editar' | 'password'>('ver');
  guardando = signal(false);
  errorFormulario = signal<string | null>(null);
  previewFoto = signal<string | null>(null);
  private fotoNueva: File | null = null;
  private quitarFoto = false;

  perfilForm = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(SOLO_LETRAS)] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(50), Validators.pattern(SOLO_LETRAS)] }),
    nombreUsuario: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(15), Validators.pattern('^[a-zA-Z0-9_]+$')] }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    fechaNacimiento: new FormControl('', { nonNullable: true, validators: [Validators.required, validarFechaNacimiento] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] })
  });

  passwordForm = new FormGroup({
    passwordActual: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d)/)] }),
    repetirPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  /** "Repetir contraseña" se valida recién cuando el usuario termina de escribir. */
  coincidencia = crearVerificadorCoincidencia(
    this.passwordForm.controls.password,
    this.passwordForm.controls.repetirPassword,
    this.destroyRef
  );

  ngOnInit(): void {
    this.cargarMisPublicaciones();
  }

  invalido(form: FormGroup, campo: string): boolean {
    const control = form.get(campo);
    return !!control && control.touched && control.invalid;
  }

  // =====================================================================
  // Editar perfil
  // =====================================================================

  abrirEdicion(): void {
    const u = this.usuarioActual();
    if (!u) return;
    this.perfilForm.reset({
      nombre: u.nombre,
      apellido: u.apellido,
      nombreUsuario: u.nombreUsuario,
      correo: u.correo,
      fechaNacimiento: u.fechaNacimiento ? new Date(u.fechaNacimiento).toISOString().slice(0, 10) : '',
      descripcion: u.descripcion ?? ''
    });
    this.previewFoto.set(u.imagen || null);
    this.fotoNueva = null;
    this.quitarFoto = false;
    this.errorFormulario.set(null);
    this.modo.set('editar');
  }

  cancelar(): void {
    this.modo.set('ver');
    this.errorFormulario.set(null);
    this.passwordForm.reset();
    this.coincidencia.reiniciar();
  }

  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.cargarFoto(file);
  }

  /** Valida y carga la imagen, elegida con el botón o soltada con arrastrar y soltar. */
  cargarFoto(file: File): void {

    if (!TIPOS_IMAGEN.includes(file.type)) {
      this.errorFormulario.set('La foto debe ser JPG, PNG o WEBP.');
      return;
    }
    if (file.size > TAMANO_MAXIMO_IMAGEN) {
      this.errorFormulario.set('La foto no puede superar los 5 MB.');
      return;
    }
    this.errorFormulario.set(null);
    this.fotoNueva = file;
    this.quitarFoto = false;
    const reader = new FileReader();
    reader.onload = (e) => this.previewFoto.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  eliminarFoto(): void {
    this.fotoNueva = null;
    this.quitarFoto = true;
    this.previewFoto.set(null);
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      this.errorFormulario.set('Revisá los campos marcados.');
      return;
    }

    const v = this.perfilForm.getRawValue();
    const formData = new FormData();
    formData.append('nombre', v.nombre.trim());
    formData.append('apellido', v.apellido.trim());
    formData.append('nombreUsuario', v.nombreUsuario.trim());
    formData.append('correo', v.correo.trim());
    formData.append('fechaNacimiento', v.fechaNacimiento);
    formData.append('descripcion', v.descripcion.trim());
    if (this.fotoNueva) formData.append('file', this.fotoNueva);
    if (this.quitarFoto) formData.append('quitarImagen', 'true');

    this.guardando.set(true);
    this.errorFormulario.set(null);

    this.usuariosService.actualizarPerfil(formData).subscribe({
      next: (res) => {
        this.guardando.set(false);
        // El backend devuelve un token nuevo (cambió el payload): se guarda y se reinicia el contador
        this.auth.iniciarSesion(res);
        this.modo.set('ver');
        this.cargarMisPublicaciones();
        this.modalService.alerta({
          categoria: 'PERFIL / GUARDADO',
          titulo: 'Perfil actualizado',
          mensaje: 'Tus datos se guardaron correctamente.',
          textoConfirmar: 'Genial',
          tipoIcono: 'success',
          esPeligro: false
        });
      },
      error: (err: HttpErrorResponse) => this.mostrarError(err, 'No pudimos guardar tu perfil.')
    });
  }

  // =====================================================================
  // Cambiar contraseña
  // =====================================================================

  abrirCambioPassword(): void {
    this.passwordForm.reset();
    this.coincidencia.reiniciar();
    this.errorFormulario.set(null);
    this.modo.set('password');
  }

  guardarPassword(): void {
    this.coincidencia.confirmarAhora();
    const v = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid || v.password !== v.repetirPassword) {
      this.passwordForm.markAllAsTouched();
      this.errorFormulario.set(
        v.password !== v.repetirPassword && v.repetirPassword
          ? 'Las contraseñas nuevas no coinciden.'
          : 'Revisá los campos marcados.'
      );
      return;
    }

    this.guardando.set(true);
    this.errorFormulario.set(null);
    this.usuariosService
      .cambiarPassword({ passwordActual: v.passwordActual, passwordNueva: v.password, repetirPassword: v.repetirPassword })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cancelar();
          this.modalService.alerta({
            categoria: 'PERFIL / SEGURIDAD',
            titulo: 'Contraseña actualizada',
            mensaje: 'La próxima vez que ingreses usá tu nueva contraseña.',
            textoConfirmar: 'Entendido',
            tipoIcono: 'success',
            esPeligro: false
          });
        },
        error: (err: HttpErrorResponse) => this.mostrarError(err, 'No pudimos cambiar la contraseña.')
      });
  }

  private mostrarError(err: HttpErrorResponse, porDefecto: string): void {
    this.guardando.set(false);
    if (err.status === 401) return; // El interceptor ya manda al login
    const msg = err.error?.message;
    this.errorFormulario.set(Array.isArray(msg) ? msg.join(' ') : msg ?? porDefecto);
  }

  // =====================================================================
  // Últimas 3 publicaciones con sus comentarios
  // =====================================================================

  cargarMisPublicaciones(): void {
    const usuario = this.usuarioActual();
    if (!usuario) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.publicacionesService.listar(0, 3, 'fecha', usuario._id).subscribe({
      next: (res) => {
        const posts = res.publicaciones || [];
        this.ultimasPublicaciones.set(posts);
        this.totalPublicaciones.set(res.total ?? posts.length);
        this.cargarComentarios(posts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private cargarComentarios(posts: IPublicacion[]): void {
    if (posts.length === 0) {
      this.comentariosPorPost.set({});
      return;
    }
    forkJoin(posts.map((p) => this.comentariosService.listar(p._id, 3, 0))).subscribe({
      next: (resultados) => {
        const mapa: Record<string, IComentario[]> = {};
        posts.forEach((p, i) => (mapa[p._id] = resultados[i].comentarios || []));
        this.comentariosPorPost.set(mapa);
      }
    });
  }

  onToggleLike(publicacionId: string): void {
    const post = this.ultimasPublicaciones().find((p) => p._id === publicacionId);
    const userId = this.usuarioActual()?._id;
    if (!post || !userId) return;

    const dar = !yaDioMeGusta(post, userId);
    const reemplazar = (p: IPublicacion) =>
      this.ultimasPublicaciones.update((lista) => lista.map((x) => (x._id === p._id ? p : x)));

    reemplazar(aplicarMeGusta(post, userId, dar));
    (dar ? this.publicacionesService.darMeGusta(publicacionId) : this.publicacionesService.quitarMeGusta(publicacionId))
      .subscribe({ error: (err) => err.status !== 409 && reemplazar(post) });
  }

  onPublicacionEditada(publicacion: IPublicacion): void {
    this.ultimasPublicaciones.update((lista) => lista.map((p) => (p._id === publicacion._id ? publicacion : p)));
    this.publicacionEditando.set(null);
  }

  async onEliminarPublicacion(publicacion: IPublicacion): Promise<void> {
    const confirmado = await this.modalService.confirmar({
      categoria: 'PUBLICACIÓN / ELIMINAR',
      titulo: '¿Eliminar tu publicación?',
      mensaje: 'La publicación y sus comentarios dejarán de estar visibles para la comunidad.',
      infoSecundaria: {
        titulo: publicacion.titulo,
        subtitulo: `${publicacion.cantidadMeGustas} me gusta · ${publicacion.cantidadComentarios} comentarios`
      },
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'trash',
      esPeligro: true
    });

    if (confirmado) {
      this.publicacionesService.eliminar(publicacion._id).subscribe({
        next: () => this.cargarMisPublicaciones()
      });
    }
  }
}
