import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { AuthService } from '../../core/services/auth.service';
import { IPublicacion } from '../../core/models/publicacion.interface';
import { IComentario } from '../../core/models/comentario.interface';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { ModalService } from '../../shared/components/modal/modal.service';
import { EditorPublicacionComponent } from '../../shared/components/editor-publicacion/editor-publicacion.component';
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { AbreviarNumeroPipe } from '../../shared/pipes/abreviar-numero.pipe';
import { CategoriaPipe } from '../../shared/pipes/categoria.pipe';
import { ImagenFallbackDirective } from '../../shared/directives/imagen-fallback.directive';
import { AutoResizeDirective } from '../../shared/directives/auto-resize.directive';
import { aplicarMeGusta, yaDioMeGusta } from '../../core/utils/me-gusta';
import { iniciarSondeo } from '../../shared/utils/sondeo';

/** Cada cuánto se buscan comentarios y me gusta nuevos (milisegundos). */
const INTERVALO_EN_VIVO_MS = 5000;
/** Cantidad de comentarios recientes que se comparan en cada actualización. */
const VENTANA_COMENTARIOS = 10;

/**
 * Componente standalone para la visualización detallada de un post y sus comentarios (Sprint 3).
 * Qué hace: Permite ver el post completo, listar comentarios paginados, escribir nuevos comentarios,
 * editar los propios anunciando '(Editado)' y borrar los propios (o cualquiera si es administrador).
 * Cómo lo hace: Lee el parámetro :id de la ruta activa, consulta PublicacionesService y ComentariosService, y gestiona formularios reactivos.
 */
@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    SpinnerComponent,
    EditorPublicacionComponent,
    TiempoRelativoPipe,
    AbreviarNumeroPipe,
    CategoriaPipe,
    ImagenFallbackDirective,
    AutoResizeDirective
  ],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css'
})
export class PublicacionDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private auth = inject(AuthService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  /** Comentarios que llegaron por la actualización automática (se resaltan unos segundos). */
  comentariosNuevos = signal<Set<string>>(new Set());
  private actualizando = false;
  /** Momento del último me gusta propio: evita que una respuesta vieja lo pise. */
  private ultimaAccionLocal = 0;

  usuarioActual = computed(() => this.auth.actualUser());

  publicacion = signal<IPublicacion | null>(null);
  comentarios = signal<IComentario[]>([]);
  totalComentarios = signal<number>(0);

  loadingPost = signal<boolean>(true);
  loadingComentarios = signal<boolean>(false);
  enviandoComentario = signal<boolean>(false);
  mostrarSpinner = signal<boolean>(false);
  editandoPublicacion = signal<boolean>(false);

  private offset = 0;
  private readonly limit = 4;
  hayMasComentarios = signal<boolean>(true);

  comentarioEnEdicionId = signal<string | null>(null);
  textoEdicionControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(150)]
  });

  nuevoComentarioForm = new FormGroup({
    texto: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)]
    })
  });

  /**
   * Signal computada que evalúa si el usuario autenticado dio like al post.
   * Qué hace: Devuelve true si el ID del usuario figura en el array meGustas.
   * Cómo lo hace: Comprueba la coincidencia sobre strings o instancias pobladas de ID.
   */
  dioMeGusta = computed(() => {
    const post = this.publicacion();
    return !!post && yaDioMeGusta(post, this.usuarioActual()?._id);
  });

  /**
   * Signal computada que indica si el post pertenece al usuario autenticado.
   * Qué hace: Permite mostrar el enlace "Ver perfil" solo cuando el autor es el usuario en sesión.
   * Cómo lo hace: Compara publicacion().usuario._id con usuarioActual()._id.
   */
  esAutorPublicacion = computed(() => {
    const autorId = this.publicacion()?.usuario?._id;
    const userId = this.usuarioActual()?._id;
    return !!autorId && !!userId && autorId.toString() === userId.toString();
  });

  /** El autor o un administrador (Sprint 4) pueden dar de baja la publicación. */
  puedeEliminarPublicacion = computed(() => this.esAutorPublicacion() || this.auth.esAdmin());

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPublicacion(id);
      this.cargarComentarios(id, true);
      // Comentarios y me gusta "en tiempo real": se actualizan solos mientras la pestaña está visible
      iniciarSondeo(() => this.actualizarEnVivo(id), INTERVALO_EN_VIVO_MS, this.destroyRef);
    } else {
      this.router.navigate(['/publicaciones']);
    }
  }

  /**
   * Consulta el post por ID al backend.
   * Qué hace: Recupera la publicación y sus datos relacionados.
   * Cómo lo hace: Llama a publicacionesService.getById() y setea el Signal publicacion.
   */
 private cargarPublicacion(id: string): void {
  this.loadingPost.set(true);
  const temporizador = setTimeout(() => {
    if (this.loadingPost()) this.mostrarSpinner.set(true);
  }, 300);

  this.publicacionesService.getById(id).subscribe({
    next: (post) => {
      clearTimeout(temporizador);
      this.publicacion.set(post);
      this.loadingPost.set(false);
      this.mostrarSpinner.set(false);
    },
    error: () => {
      clearTimeout(temporizador);
      this.loadingPost.set(false);
      this.mostrarSpinner.set(false);
      this.router.navigate(['/publicaciones']);
    }
  });
}

  /**
   * Consulta los comentarios de la publicación con paginación.
   * Qué hace: Trae los comentarios de forma incremental según el límite establecido.
   * Cómo lo hace: Invoca comentariosService.listar() y actualiza el array de comentarios y el contador total.
   */
  cargarComentarios(publicacionId: string, reiniciar: boolean = false): void {
    if (reiniciar) {
      this.offset = 0;
    }
    this.loadingComentarios.set(true);

    this.comentariosService
      .listar(publicacionId, this.limit, this.offset)
      .subscribe({
        next: (res) => {
          const nuevos = res.comentarios || [];

          if (reiniciar) {
            this.comentarios.set(nuevos);
          } else {
            this.comentarios.update((prev) => [...prev, ...nuevos]);
          }

          this.totalComentarios.set(res.total ?? this.comentarios().length);
          this.offset += nuevos.length;
          this.hayMasComentarios.set(this.comentarios().length < this.totalComentarios());
          this.loadingComentarios.set(false);
        },
        error: () => {
          this.loadingComentarios.set(false);
        }
      });
  }

  /**
   * Solicita el siguiente lote de comentarios.
   * Qué hace: Incrementa la lista sin borrar los comentarios ya mostrados.
   * Cómo lo hace: Llama a cargarComentarios pasando reiniciar: false.
   */
  cargarMasComentarios(): void {
    const post = this.publicacion();
    if (post) {
      this.cargarComentarios(post._id, false);
    }
  }

  /**
   * Registra o remueve el Me Gusta del post actual.
   * Qué hace: Alterna el like y sincroniza el contador reactivamente.
   * Cómo lo hace: Llama a publicacionesService.darMeGusta o quitarMeGusta según dioMeGusta().
   */
  // =====================================================================
  // Actualización en vivo
  // =====================================================================

  /**
   * Trae la publicación (me gusta, contador de comentarios, ediciones) y los comentarios más
   * recientes, y los combina con lo que ya está en pantalla sin perder la paginación.
   */
  private actualizarEnVivo(id: string): void {
    if (this.actualizando || this.loadingPost() || this.loadingComentarios()) return;
    this.actualizando = true;

    forkJoin({
      post: this.publicacionesService.getById(id),
      comentarios: this.comentariosService.listar(id, VENTANA_COMENTARIOS, 0)
    }).subscribe({
      next: ({ post, comentarios }) => {
        this.actualizando = false;
        if (Date.now() - this.ultimaAccionLocal > 2500) this.publicacion.set(post);
        this.fusionarComentarios(comentarios.comentarios || [], comentarios.total ?? 0);
      },
      error: (err: HttpErrorResponse) => {
        this.actualizando = false;
        if (err.status === 404) this.publicacionDadaDeBaja();
      }
    });
  }

  private fusionarComentarios(recientes: IComentario[], total: number): void {
    const actuales = this.comentarios();
    const idsActuales = new Set(actuales.map((c) => c._id));
    const recientesPorId = new Map(recientes.map((c) => [c._id, c]));

    // Si llegaron menos que la ventana, son todos los comentarios que existen
    const sonTodos = recientes.length < VENTANA_COMENTARIOS;
    const limite = recientes.length ? new Date(recientes[recientes.length - 1].createdAt).getTime() : Infinity;

    const nuevos = recientes.filter((c) => !idsActuales.has(c._id));
    const eliminados = new Set(
      actuales
        .filter((c) => !recientesPorId.has(c._id) && (sonTodos || new Date(c.createdAt).getTime() >= limite))
        .map((c) => c._id)
    );

    let huboCambios = nuevos.length > 0 || eliminados.size > 0 || total !== this.totalComentarios();
    const conservados = actuales
      .filter((c) => !eliminados.has(c._id))
      .map((c) => {
        const reciente = recientesPorId.get(c._id);
        // No se pisa un comentario que el usuario está editando en este momento
        if (!reciente || this.comentarioEnEdicionId() === c._id) return c;
        if (reciente.texto !== c.texto || reciente.modificado !== c.modificado) {
          huboCambios = true;
          return { ...c, texto: reciente.texto, modificado: reciente.modificado };
        }
        return c;
      });

    if (!huboCambios) return;

    const lista = [...nuevos, ...conservados];
    this.comentarios.set(lista);
    this.offset = Math.max(0, this.offset + nuevos.length - eliminados.size);
    this.totalComentarios.set(total);
    this.hayMasComentarios.set(lista.length < total);

    if (nuevos.length) {
      const ids = nuevos.map((c) => c._id);
      this.comentariosNuevos.update((set) => new Set([...set, ...ids]));
      setTimeout(() => {
        this.comentariosNuevos.update((set) => {
          const copia = new Set(set);
          ids.forEach((i) => copia.delete(i));
          return copia;
        });
      }, 4000);
    }
  }

  private publicacionDadaDeBaja(): void {
    this.router.navigate(['/publicaciones']).then(() =>
      this.modalService.alerta({
        categoria: 'PUBLICACIÓN / NO DISPONIBLE',
        titulo: 'La publicación ya no está disponible',
        mensaje: 'Fue eliminada por su autor o dada de baja por un administrador.',
        textoConfirmar: 'Volver a publicaciones',
        tipoIcono: 'alert',
        esPeligro: false
      })
    );
  }

  toggleLike(): void {
    const post = this.publicacion();
    const userId = this.usuarioActual()?._id;
    if (!post || !userId) return;

    const dar = !this.dioMeGusta();
    this.ultimaAccionLocal = Date.now();
    this.publicacion.set(aplicarMeGusta(post, userId, dar));

    const peticion = dar
      ? this.publicacionesService.darMeGusta(post._id)
      : this.publicacionesService.quitarMeGusta(post._id);

    peticion.subscribe({
      // Si falla (salvo 409: el estado ya era ese) se vuelve al estado anterior
      error: (err) => {
        if (err.status !== 409) this.publicacion.set(post);
      }
    });
  }

  onPublicacionEditada(actualizada: IPublicacion): void {
    this.publicacion.set(actualizada);
    this.editandoPublicacion.set(false);
  }

  async eliminarPublicacion(): Promise<void> {
    const post = this.publicacion();
    if (!post) return;

    const confirmado = await this.modalService.confirmar({
      categoria: this.esAutorPublicacion() ? 'PUBLICACIÓN / ELIMINAR' : 'MODERACIÓN / ADMINISTRADOR',
      titulo: this.esAutorPublicacion() ? '¿Eliminar tu publicación?' : '¿Dar de baja esta publicación?',
      mensaje: 'La publicación y sus comentarios dejarán de estar visibles para la comunidad.',
      infoSecundaria: { titulo: post.titulo, subtitulo: `@${post.usuario.nombreUsuario}` },
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'trash',
      esPeligro: true
    });
    if (!confirmado) return;

    this.publicacionesService.eliminar(post._id).subscribe({
      next: () => this.router.navigate(['/publicaciones'])
    });
  }

  /**
   * Envía un nuevo comentario al post.
   * Qué hace: Agrega el comentario al principio del hilo y actualiza los contadores.
   * Cómo lo hace: Invoca comentariosService.crear() con el texto y resetea el formulario reactivo.
   */
  enviarComentario(): void {
    if (this.nuevoComentarioForm.invalid) {
      this.nuevoComentarioForm.markAllAsTouched();
      return;
    }

    const post = this.publicacion();
    const idDeRuta = this.route.snapshot.paramMap.get('id');
    const postIdentificador = post?._id || idDeRuta;

    if (!postIdentificador) return;

    const texto = this.nuevoComentarioForm.controls.texto.value?.trim();
    if (!texto) return;

    this.enviandoComentario.set(true);

    this.comentariosService.crear(postIdentificador, texto).subscribe({
      next: (nuevoComentario) => {
        this.enviandoComentario.set(false);
        this.nuevoComentarioForm.reset({ texto: '' });

        this.comentarios.update((lista) => [nuevoComentario, ...lista]);
        this.offset += 1; // Mantiene alineada la paginación con el comentario recién creado
        this.totalComentarios.update((t) => t + 1);
        this.hayMasComentarios.set(this.comentarios().length < this.totalComentarios());

        this.publicacion.update((p) => {
          if (!p) return null;
          return {
            ...p,
            cantidadComentarios: (p.cantidadComentarios || 0) + 1
          };
        });
      },
      error: () => {
        this.enviandoComentario.set(false);
      }
    });
  }

  /**
   * Inicia el modo de edición en línea de un comentario.
   * Qué hace: Activa el textarea con el texto original del comentario.
   * Cómo lo hace: Setea el ID en comentarioEnEdicionId y asigna el valor al control.
   */
  iniciarEdicion(comentario: IComentario): void {
    this.comentarioEnEdicionId.set(comentario._id);
    this.textoEdicionControl.setValue(comentario.texto);
  }

  /**
   * Cancela la edición en línea del comentario.
   * Qué hace: Vuelve a mostrar el texto original del comentario.
   * Cómo lo hace: Pone en null comentarioEnEdicionId y resetea el control.
   */
  cancelarEdicion(): void {
    this.comentarioEnEdicionId.set(null);
    this.textoEdicionControl.reset();
  }

  /**
   * Guarda los cambios de un comentario editado (Sprint 3).
   * Qué hace: Modifica el mensaje, descarta textos en blanco y marca que fue modificado.
   * Cómo lo hace: Llama a comentariosService.actualizar() y actualiza el Signal del comentario con modificado: true.
   */
  guardarEdicion(comentarioId: string): void {
    if (this.textoEdicionControl.invalid) return;

    const nuevoTexto = this.textoEdicionControl.value.trim();
    if (!nuevoTexto) return;

    this.comentariosService.actualizar(comentarioId, nuevoTexto).subscribe({
      next: () => {
        this.comentarios.update((lista) =>
          lista.map((c) => (c._id === comentarioId ? { ...c, texto: nuevoTexto, modificado: true } : c))
        );
        this.cancelarEdicion();
      }
    });
  }

  /**
   * Elimina un comentario (baja lógica).
   * Qué hace: Remueve el comentario del hilo y decrementa los contadores.
   * Cómo lo hace: Invoca comentariosService.eliminar() y actualiza los Signals locales.
   */
  async eliminarComentario(comentario: IComentario): Promise<void> {
    const confirmado = await this.modalService.confirmar({
      categoria: 'COMENTARIO / ELIMINAR',
      titulo: '¿Eliminar el comentario?',
      mensaje: 'El comentario dejará de verse en la publicación.',
      infoSecundaria: { titulo: comentario.texto, subtitulo: `@${comentario.usuario.nombreUsuario}` },
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'trash',
      esPeligro: true
    });
    if (!confirmado) return;

    const comentarioId = comentario._id;
    this.comentariosService.eliminar(comentarioId).subscribe({
      next: () => {
        this.comentarios.update((lista) => lista.filter((c) => c._id !== comentarioId));
        this.offset = Math.max(0, this.offset - 1);
        this.totalComentarios.update((t) => Math.max(0, t - 1));
        this.hayMasComentarios.set(this.comentarios().length < this.totalComentarios());

        this.publicacion.update((p) => {
          if (!p) return null;
          return { ...p, cantidadComentarios: Math.max(0, p.cantidadComentarios - 1) };
        });
      }
    });
  }

  /**
   * Comprueba si el usuario autenticado es el autor del comentario.
   * Qué hace: Controla la visibilidad del botón de edición.
   * Cómo lo hace: Compara usuarioActual()._id contra comentario.usuario._id.
   */
  esAutorComentario(comentario: IComentario): boolean {
    return this.usuarioActual()?._id === comentario.usuario?._id;
  }

  /**
   * Comprueba si el usuario puede dar de baja un comentario.
   * Qué hace: Habilita el botón de eliminar para el autor o para un administrador.
   * Cómo lo hace: Combina esAutorComentario() con la verificación del perfil 'administrador'.
   */
  puedeEliminarComentario(comentario: IComentario): boolean {
    return this.esAutorComentario(comentario) || this.usuarioActual()?.perfil === 'administrador';
  }
}

