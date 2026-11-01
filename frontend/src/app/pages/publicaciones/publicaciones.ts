// Importamos utilidades reactivas y del ciclo de vida de Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
// Importamos módulos de formularios reactivos para el post
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// Importamos el servicio de publicaciones
import { PublicacionesService } from '../../core/services/publicaciones.service';
// Importamos el servicio de autenticación
import { AuthService } from '../../core/services/auth.service';
// Importamos el servicio del modal para la confirmación de baja lógica
import { ModalService } from '../../shared/components/modal/modal.service';
// Importamos el modelo tipado de la publicación
import { IPublicacion } from '../../core/models/publicacion.interface';
// Importamos el componente de tarjeta de post
import { PublicacionCardComponent } from './components/publicacion-card/publicacion-card.component';
// Importamos el spinner de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
// Importamos la directiva que auto-expande el textarea
import { AutoResizeDirective } from '../../shared/directives/auto-resize.directive';

/**
 * Componente principal del feed social de publicaciones.
 */
@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PublicacionCardComponent,
    SpinnerComponent,
    AutoResizeDirective
  ],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class Publicaciones implements OnInit {
  // Inyección de servicios
  private publicacionesService = inject(PublicacionesService);
  private auth = inject(AuthService);
  private modalService = inject(ModalService);

  // Signal del usuario en sesión
  usuarioActual = computed(() => this.auth.actualUser());

  // Signal que contiene la lista reactiva de publicaciones mostradas en el feed
  publicaciones = signal<IPublicacion[]>([]);

  // Signals para estados de carga
  loadingInicial = signal<boolean>(true);
  loadingMas = signal<boolean>(false);
  creandoPost = signal<boolean>(false);

  // Signal del criterio de ordenamiento activo: 'fecha' o 'meGustas'
  ordenActivo = signal<'fecha' | 'meGustas'>('fecha');

  // Parámetros de paginación incremental
  private offset = 0;
  private readonly limit = 5;
  hayMasPublicaciones = signal<boolean>(true);
  totalRegistrado = signal<number>(0);

  // Archivo de imagen seleccionado para el nuevo post
  archivoSeleccionado: File | null = null;
  nombreArchivo = signal<string | null>(null);

  // Formulario reactivo para crear una nueva publicación
  publicacionForm = new FormGroup({
    titulo: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)]
    }),
    descripcion: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)]
    })
  });

  ngOnInit(): void {
    // Al montar la página, realizamos la primera carga del feed
    this.cargarPublicaciones(true);
  }

  /**
   * Cambia el criterio de ordenamiento y reinicia la paginación desde cero
   */
  cambiarOrden(nuevoOrden: 'fecha' | 'meGustas'): void {
    if (this.ordenActivo() === nuevoOrden) return;
    this.ordenActivo.set(nuevoOrden);
    this.cargarPublicaciones(true);
  }

  /**
   * Consulta las publicaciones al backend NestJS
   */
  cargarPublicaciones(reiniciar: boolean = false): void {
    if (reiniciar) {
      this.offset = 0;
      this.loadingInicial.set(true);
    } else {
      this.loadingMas.set(true);
    }

    this.publicacionesService
      .listar(this.offset, this.limit, this.ordenActivo())
      .subscribe({
        next: (res) => {
          const nuevas = res.publicaciones || [];

          if (reiniciar) {
            this.publicaciones.set(nuevas);
          } else {
            this.publicaciones.update((actuales) => [...actuales, ...nuevas]);
          }

          // Verificamos si aún quedan publicaciones por consultar
          this.hayMasPublicaciones.set(nuevas.length === this.limit);
          this.offset += nuevas.length;
          this.totalRegistrado.set(this.publicaciones().length);

          this.loadingInicial.set(false);
          this.loadingMas.set(false);
        },
        error: () => {
          this.loadingInicial.set(false);
          this.loadingMas.set(false);
        }
      });
  }

  /**
   * Captura el archivo seleccionado para la imagen del post
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.archivoSeleccionado = file;
      this.nombreArchivo.set(file.name);
    }
  }

  /**
   * Elimina la selección de archivo actual
   */
  quitarArchivo(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivo.set(null);
  }

  /**
   * Envía la publicación al backend mediante FormData
   */
  onSubmit(): void {
    if (this.publicacionForm.invalid) {
      this.publicacionForm.markAllAsTouched();
      return;
    }

    this.creandoPost.set(true);
    const { titulo, descripcion } = this.publicacionForm.getRawValue();

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);

    if (this.archivoSeleccionado) {
      formData.append('file', this.archivoSeleccionado);
    }

    this.publicacionesService.crear(formData).subscribe({
      next: (res) => {
        this.creandoPost.set(false);
        this.publicacionForm.reset();
        this.quitarArchivo();

        // Si el post recién creado viene populado, lo insertamos al principio del feed
        if (res.publicacion) {
          this.publicaciones.update((posts) => [res.publicacion, ...posts]);
          this.totalRegistrado.update((t) => t + 1);
        } else {
          this.cargarPublicaciones(true);
        }
      },
      error: () => {
        this.creandoPost.set(false);
      }
    });
  }

  /**
   * Da o quita un Me Gusta sobre una publicación específica
   */
  onToggleLike(publicacionId: string): void {
    const post = this.publicaciones().find((p) => p._id === publicacionId);
    if (!post) return;

    const userId = this.usuarioActual()?._id;
    if (!userId) return;

    const yaDioLike = post.meGustas.includes(userId);

    if (yaDioLike) {
      // Quitar Me Gusta
      this.publicacionesService.quitarMeGusta(publicacionId).subscribe({
        next: () => {
          this.publicaciones.update((posts) =>
            posts.map((p) => {
              if (p._id === publicacionId) {
                return {
                  ...p,
                  meGustas: p.meGustas.filter((id) => id !== userId),
                  cantidadMeGustas: Math.max(0, p.cantidadMeGustas - 1)
                };
              }
              return p;
            })
          );
        }
      });
    } else {
      // Dar Me Gusta
      this.publicacionesService.darMeGusta(publicacionId).subscribe({
        next: () => {
          this.publicaciones.update((posts) =>
            posts.map((p) => {
              if (p._id === publicacionId) {
                return {
                  ...p,
                  meGustas: [...p.meGustas, userId],
                  cantidadMeGustas: p.cantidadMeGustas + 1
                };
              }
              return p;
            })
          );
        }
      });
    }
  }

  /**
   * Abre el modal de confirmación y procesa la baja lógica de la publicación
   */
  async onEliminarPublicacion(publicacion: IPublicacion): Promise<void> {
    const confirmado = await this.modalService.confirmar({
      categoria: 'MODERACIÓN / CONFIRMACIÓN',
      titulo: 'Dar de baja publicación',
      mensaje: 'La publicación dejará de estar visible en la comunidad. Esta acción no elimina tu cuenta.',
      infoSecundaria: {
        titulo: publicacion.titulo,
        subtitulo: `@${publicacion.usuario?.nombreUsuario} · ${publicacion.cantidadMeGustas} Me Gusta · ${publicacion.cantidadComentarios} comentarios`
      },
      textoConfirmar: 'Dar de baja publicación',
      textoCancelar: 'Cancelar',
      tipoIcono: 'trash',
      esPeligro: true
    });

    if (confirmado) {
      this.publicacionesService.eliminar(publicacion._id).subscribe({
        next: () => {
          // Removemos la publicación del feed reactivamente
          this.publicaciones.update((posts) => posts.filter((p) => p._id !== publicacion._id));
          this.totalRegistrado.update((t) => Math.max(0, t - 1));
        }
      });
    }
  }
}
