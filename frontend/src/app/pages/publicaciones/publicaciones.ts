import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import {
  CATEGORIAS,
  CategoriaPublicacion,
  IPublicacion
} from '../../core/models/publicacion.interface';
import { aplicarMeGusta, yaDioMeGusta } from '../../core/utils/me-gusta';
import { iniciarSondeo } from '../../shared/utils/sondeo';

/** Cada cuánto se actualizan me gusta, comentarios y publicaciones nuevas (milisegundos). */
const INTERVALO_EN_VIVO_MS = 8000;
import { PublicacionCardComponent } from './components/publicacion-card/publicacion-card.component';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { EditorPublicacionComponent } from '../../shared/components/editor-publicacion/editor-publicacion.component';
import { ImagenFallbackDirective } from '../../shared/directives/imagen-fallback.directive';
import { SoltarArchivoDirective } from '../../shared/directives/soltar-archivo.directive';
import { AutoResizeDirective } from '../../shared/directives/auto-resize.directive';
import { AbreviarNumeroPipe } from '../../shared/pipes/abreviar-numero.pipe';
import { TAMANO_MAXIMO_IMAGEN, TIPOS_IMAGEN } from '../../shared/components/formulario-usuario/formulario-usuario.component';

/**
 * Página de publicaciones (Sprint 2).
 * - Listado ordenado por fecha (por defecto) o por cantidad de me gusta, paginado con "cargar más".
 * - Filtro por categoría.
 * - Alta de publicación con título, mensaje, categoría, juego e imagen opcional.
 * - Me gusta / quitar me gusta, edición (autor) y baja (autor o administrador).
 */
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PublicacionCardComponent,
    SpinnerComponent,
    EditorPublicacionComponent,
    ImagenFallbackDirective,
    AutoResizeDirective,
    SoltarArchivoDirective,
    AbreviarNumeroPipe
  ],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private auth = inject(AuthService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  /** Publicaciones nuevas detectadas en vivo que todavía no se muestran (aviso "hay nuevas"). */
  publicacionesPendientes = signal<IPublicacion[]>([]);
  private actualizando = false;
  private ultimaAccionLocal = 0;

  readonly categorias = CATEGORIAS;
  usuarioActual = computed(() => this.auth.actualUser());

  publicaciones = signal<IPublicacion[]>([]);
  loadingInicial = signal(true);
  loadingMas = signal(false);
  creandoPost = signal(false);
  errorCarga = signal(false);

  ordenActivo = signal<'fecha' | 'meGustas'>('fecha');
  categoriaActiva = signal<CategoriaPublicacion | null>(null);

  private offset = 0;
  private readonly limit = 5;
  hayMasPublicaciones = signal(true);
  totalRegistrado = signal(0);

  archivoSeleccionado: File | null = null;
  nombreArchivo = signal<string | null>(null);

  /** Publicación abierta en el editor (null = editor cerrado). */
  publicacionEditando = signal<IPublicacion | null>(null);

  publicacionForm = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
    categoria: new FormControl<CategoriaPublicacion>('general', { nonNullable: true }),
    juego: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] })
  });

  ngOnInit(): void {
    this.cargarPublicaciones(true);
    // Me gusta, comentarios y publicaciones nuevas "en tiempo real"
    iniciarSondeo(() => this.actualizarEnVivo(), INTERVALO_EN_VIVO_MS, this.destroyRef);
  }

  // ------------------------------------------------------------
  // Listado
  // ------------------------------------------------------------

  cambiarOrden(nuevoOrden: 'fecha' | 'meGustas'): void {
    if (this.ordenActivo() === nuevoOrden) return;
    this.ordenActivo.set(nuevoOrden);
    this.cargarPublicaciones(true);
  }

  cambiarCategoria(categoria: CategoriaPublicacion | null): void {
    if (this.categoriaActiva() === categoria) return;
    this.categoriaActiva.set(categoria);
    this.cargarPublicaciones(true);
  }

  cargarPublicaciones(reiniciar = false): void {
    if (reiniciar) {
      this.offset = 0;
      this.publicacionesPendientes.set([]);
      this.loadingInicial.set(true);
    } else {
      this.loadingMas.set(true);
    }
    this.errorCarga.set(false);

    this.publicacionesService
      .listar(this.offset, this.limit, this.ordenActivo(), undefined, this.categoriaActiva())
      .subscribe({
        next: (res) => {
          const nuevas = res.publicaciones || [];
          this.publicaciones.update((actuales) => {
            if (reiniciar) return nuevas;
            // Evita duplicados si mientras tanto se corrió la paginación por publicaciones nuevas
            const ids = new Set(actuales.map((p) => p._id));
            return [...actuales, ...nuevas.filter((p) => !ids.has(p._id))];
          });
          this.offset += nuevas.length;
          this.totalRegistrado.set(res.total ?? this.publicaciones().length);
          this.hayMasPublicaciones.set(nuevas.length > 0 && this.offset < this.totalRegistrado());
          this.loadingInicial.set(false);
          this.loadingMas.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loadingInicial.set(false);
          this.loadingMas.set(false);
          if (err.status !== 401) this.errorCarga.set(true);
        }
      });
  }

  // ------------------------------------------------------------
  // Actualización en vivo
  // ------------------------------------------------------------

  /**
   * Vuelve a pedir las primeras publicaciones de la lista (hasta 10) y actualiza en pantalla
   * los me gusta, la cantidad de comentarios y las ediciones. Si hay publicaciones nuevas,
   * muestra un aviso en lugar de mover la lista mientras el usuario lee.
   */
  private actualizarEnVivo(): void {
    if (this.actualizando || this.loadingInicial() || this.loadingMas() || this.errorCarga()) return;
    const cantidad = Math.min(Math.max(this.publicaciones().length, this.limit), 10);
    this.actualizando = true;

    this.publicacionesService
      .listar(0, cantidad, this.ordenActivo(), undefined, this.categoriaActiva())
      .subscribe({
        next: (res) => {
          this.actualizando = false;
          this.fusionarPublicaciones(res.publicaciones || [], res.total ?? 0, cantidad);
        },
        error: () => (this.actualizando = false)
      });
  }

  private fusionarPublicaciones(recientes: IPublicacion[], total: number, pedidas: number): void {
    const porId = new Map(recientes.map((p) => [p._id, p]));
    const actuales = this.publicaciones();
    const idsActuales = new Set(actuales.map((p) => p._id));
    const idsPendientes = new Set(this.publicacionesPendientes().map((p) => p._id));

    // 1) Me gusta / comentarios / ediciones de las publicaciones visibles
    const recienLikeada = Date.now() - this.ultimaAccionLocal < 2500;
    let lista = actuales.map((p) => {
      const r = porId.get(p._id);
      if (!r || recienLikeada) return p;
      const cambio =
        r.cantidadMeGustas !== p.cantidadMeGustas ||
        r.cantidadComentarios !== p.cantidadComentarios ||
        r.updatedAt !== p.updatedAt;
      return cambio ? r : p;
    });

    // 2) Publicaciones nuevas y eliminadas (solo con orden por fecha, donde la posición es estable)
    if (this.ordenActivo() === 'fecha') {
      const masNueva = actuales.length ? new Date(actuales[0].createdAt).getTime() : 0;
      const nuevas = recientes.filter(
        (p) => !idsActuales.has(p._id) && !idsPendientes.has(p._id) && new Date(p.createdAt).getTime() > masNueva
      );
      if (nuevas.length) {
        this.publicacionesPendientes.update((pend) => [...nuevas, ...pend]);
        this.offset += nuevas.length; // la paginación del servidor se corrió
      }

      const sonTodas = recientes.length < pedidas;
      const limite = recientes.length ? new Date(recientes[recientes.length - 1].createdAt).getTime() : Infinity;
      const antes = lista.length;
      lista = lista.filter(
        (p) => porId.has(p._id) || (!sonTodas && new Date(p.createdAt).getTime() < limite)
      );
      this.offset = Math.max(0, this.offset - (antes - lista.length));
    }

    if (lista.some((p, i) => p !== actuales[i]) || lista.length !== actuales.length) {
      this.publicaciones.set(lista);
    }
    this.totalRegistrado.set(total);
    this.hayMasPublicaciones.set(this.offset < total);
  }

  /** Muestra las publicaciones nuevas que avisó el cartel. */
  mostrarNuevas(): void {
    this.publicaciones.update((posts) => [...this.publicacionesPendientes(), ...posts]);
    this.publicacionesPendientes.set([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------
  // Crear publicación
  // ------------------------------------------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.cargarImagen(file);
  }

  /** Valida y carga la imagen, elegida con el botón o soltada con arrastrar y soltar. */
  cargarImagen(file: File): void {

    if (!TIPOS_IMAGEN.includes(file.type) || file.size > TAMANO_MAXIMO_IMAGEN) {
      this.modalService.alerta({
        categoria: 'PUBLICACIÓN / IMAGEN',
        titulo: 'Imagen no válida',
        mensaje: 'La imagen tiene que ser JPG, PNG o WEBP y pesar menos de 5 MB.',
        textoConfirmar: 'Entendido',
        tipoIcono: 'alert',
        esPeligro: true
      });
      return;
    }
    this.archivoSeleccionado = file;
    this.nombreArchivo.set(file.name);
  }

  quitarArchivo(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo.set(null);
  }

  onSubmit(): void {
    if (this.publicacionForm.invalid) {
      this.publicacionForm.markAllAsTouched();
      return;
    }

    this.creandoPost.set(true);
    const v = this.publicacionForm.getRawValue();
    const formData = new FormData();
    formData.append('titulo', v.titulo.trim());
    formData.append('descripcion', v.descripcion.trim());
    formData.append('categoria', v.categoria);
    if (v.juego.trim()) formData.append('juego', v.juego.trim());
    if (this.archivoSeleccionado) formData.append('file', this.archivoSeleccionado);

    this.publicacionesService.crear(formData).subscribe({
      next: (res) => {
        this.creandoPost.set(false);
        this.publicacionForm.reset({ titulo: '', descripcion: '', categoria: 'general', juego: '' });
        this.quitarArchivo();

        const encajaEnFiltro = !this.categoriaActiva() || this.categoriaActiva() === res.publicacion.categoria;
        if (this.ordenActivo() === 'fecha' && encajaEnFiltro) {
          this.publicaciones.update((posts) => [res.publicacion, ...posts]);
          this.offset += 1;
          this.totalRegistrado.update((t) => t + 1);
        } else {
          this.cargarPublicaciones(true);
        }
      },
      error: (err) => {
        this.creandoPost.set(false);
        if (err.status === 401) return; // El interceptor ya redirige al login
        const msg = err?.error?.message;
        this.modalService.alerta({
          categoria: 'PUBLICACIÓN / ERROR',
          titulo: 'No se pudo publicar',
          mensaje: Array.isArray(msg) ? msg.join(' ') : msg ?? 'Intentá de nuevo en unos instantes.',
          textoConfirmar: 'Entendido',
          tipoIcono: 'alert',
          esPeligro: true
        });
      }
    });
  }

  // ------------------------------------------------------------
  // Acciones sobre cada publicación
  // ------------------------------------------------------------

  private reemplazar(publicacion: IPublicacion): void {
    this.publicaciones.update((posts) => posts.map((p) => (p._id === publicacion._id ? publicacion : p)));
  }

  onToggleLike(publicacionId: string): void {
    const post = this.publicaciones().find((p) => p._id === publicacionId);
    const userId = this.usuarioActual()?._id;
    if (!post || !userId) return;

    const dar = !yaDioMeGusta(post, userId);
    this.ultimaAccionLocal = Date.now();
    const peticion = dar
      ? this.publicacionesService.darMeGusta(publicacionId)
      : this.publicacionesService.quitarMeGusta(publicacionId);

    // Actualización optimista: se ve el cambio al instante y se revierte si falla
    this.reemplazar(aplicarMeGusta(post, userId, dar));
    peticion.subscribe({
      error: (err: HttpErrorResponse) => {
        // 409 = el estado ya era ese (por ejemplo, otra pestaña): se deja como quedó
        if (err.status !== 409) this.reemplazar(post);
      }
    });
  }

  onEditar(publicacion: IPublicacion): void {
    this.publicacionEditando.set(publicacion);
  }

  onEditada(publicacion: IPublicacion): void {
    this.reemplazar(publicacion);
    this.publicacionEditando.set(null);
  }

  async onEliminarPublicacion(publicacion: IPublicacion): Promise<void> {
    const esPropia = publicacion.usuario?._id === this.usuarioActual()?._id;
    const confirmado = await this.modalService.confirmar({
      categoria: esPropia ? 'PUBLICACIÓN / ELIMINAR' : 'MODERACIÓN / ADMINISTRADOR',
      titulo: esPropia ? '¿Eliminar tu publicación?' : '¿Dar de baja esta publicación?',
      mensaje: 'La publicación y sus comentarios dejarán de estar visibles para la comunidad.',
      infoSecundaria: {
        titulo: publicacion.titulo,
        subtitulo: `@${publicacion.usuario?.nombreUsuario} · ${publicacion.cantidadMeGustas} me gusta · ${publicacion.cantidadComentarios} comentarios`
      },
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      tipoIcono: 'trash',
      esPeligro: true
    });
    if (!confirmado) return;

    this.publicacionesService.eliminar(publicacion._id).subscribe({
      next: () => {
        this.publicaciones.update((posts) => posts.filter((p) => p._id !== publicacion._id));
        this.offset = Math.max(0, this.offset - 1);
        this.totalRegistrado.update((t) => Math.max(0, t - 1));
        this.hayMasPublicaciones.set(this.offset < this.totalRegistrado());
      }
    });
  }
}
