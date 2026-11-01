// Importamos utilidades reactivas y del ciclo de vida de Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
// Importamos módulos de rutas para extraer el parámetro ID y navegar
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// Importamos formularios reactivos para el comentario y la edición en línea
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// Importamos servicios de publicaciones, comentarios y autenticación
import { PublicacionesService } from '../../core/services/publicaciones.service';
import { ComentariosService } from '../../core/services/comentarios.service';
import { AuthService } from '../../core/services/auth.service';
// Importamos interfaces de datos tipadas
import { IPublicacion } from '../../core/models/publicacion.interface';
import { IComentario } from '../../core/models/comentario.interface';
// Importamos pipes personalizadas para formateo y emoticones
import { TiempoRelativoPipe } from '../../shared/pipes/tiempo-relativo.pipe';
import { FormatearFechaPipe } from '../../shared/pipes/formatear-fecha.pipe';
import { EmoticonPipe } from '../../shared/pipes/emoticon.pipe';
// Importamos directivas de enfoque y redimensionamiento automático
import { AutoResizeDirective } from '../../shared/directives/auto-resize.directive';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

/**
 * Componente standalone para la vista de detalle de publicación y sus comentarios.
 */
@Component({
  selector: 'app-publicacion-detalle',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TiempoRelativoPipe,
    FormatearFechaPipe,
    EmoticonPipe,
    AutoResizeDirective,
    SpinnerComponent
  ],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css'
})
export class PublicacionDetalle implements OnInit {
  // Inyección de dependencias
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  private auth = inject(AuthService);


  readonly defaultAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2364748b"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

  // Signal del usuario en sesión
  usuarioActual = computed(() => this.auth.actualUser());

  // Signal con la publicación principal
  publicacion = signal<IPublicacion | null>(null);

  // Signals para el listado de comentarios
  comentarios = signal<IComentario[]>([]);
  totalComentarios = signal<number>(0);

  // Signals para estados de carga
  loadingPost = signal<boolean>(true);
  loadingComentarios = signal<boolean>(false);
  enviandoComentario = signal<boolean>(false);

  // Parámetros de paginación para comentarios
  private offset = 0;
  private readonly limit = 4;
  hayMasComentarios = signal<boolean>(true);

  // Estado para edición en línea de un comentario
  comentarioEnEdicionId = signal<string | null>(null);
  textoEdicionControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(150)]
  });

  // Formulario reactivo para redactar un nuevo comentario
  nuevoComentarioForm = new FormGroup({
    texto: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)]
    })
  });


  // 1. Signal computada blindada contra undefined y contra ObjectIds poblados
dioMeGusta = computed(() => {
  const post = this.publicacion();
  const userId = this.usuarioActual()?._id;
  if (!post || !userId) return false;

  const likes = post.meGustas || [];
  return likes.some((item: any) => {
    const id = item?._id ?? item;
    return id?.toString() === userId.toString();
  });
});




  // Signal computada que determina si el usuario dio like al post actual
  // dioMeGusta = computed(() => {
  //   const post = this.publicacion();
  //   const userId = this.usuarioActual()?._id;
  //   if (!post || !userId) return false;
  //   return post.meGustas.includes(userId);
  // });

  ngOnInit(): void {
    // Obtenemos el parámetro 'id' de la URL activa
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarPublicacion(id);
      this.cargarComentarios(id, true);
    } else {
      this.router.navigate(['/publicaciones']);
    }
  }

  /**
   * Consulta el post por ID al backend
   */
  private cargarPublicacion(id: string): void {
    this.loadingPost.set(true);
    this.publicacionesService.getById(id).subscribe({
      next: (post) => {
        this.publicacion.set(post);
        this.loadingPost.set(false);
      },
      error: () => {
        this.loadingPost.set(false);
        this.router.navigate(['/publicaciones']);
      }
    });
  }

  /**
   * Consulta los comentarios de la publicación con paginación
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

          this.totalComentarios.set(res.total || this.comentarios().length);
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
   * Carga el siguiente bloque de comentarios
   */
  cargarMasComentarios(): void {
    const post = this.publicacion();
    if (post) {
      this.cargarComentarios(post._id, false);
    }
  }



  // 2. toggleLike seguro
toggleLike(): void {
  const post = this.publicacion();
  const userId = this.usuarioActual()?._id;
  if (!post || !userId) return;

  const yaDioLike = this.dioMeGusta();

  if (yaDioLike) {
    this.publicacionesService.quitarMeGusta(post._id).subscribe({
      next: () => {
        this.publicacion.update((p) => {
          if (!p) return null;
          const meGustasActuales = p.meGustas || [];
          return {
            ...p,
            meGustas: meGustasActuales.filter((item: any) => {
              const id = item?._id ?? item;
              return id?.toString() !== userId.toString();
            }),
            cantidadMeGustas: Math.max(0, (p.cantidadMeGustas || 1) - 1)
          };
        });
      }
    });
  } else {
    this.publicacionesService.darMeGusta(post._id).subscribe({
      next: () => {
        this.publicacion.update((p) => {
          if (!p) return null;
          const meGustasActuales = p.meGustas || [];
          return {
            ...p,
            meGustas: [...meGustasActuales, userId],
            cantidadMeGustas: (p.cantidadMeGustas || 0) + 1
          };
        });
      }
    });
  }
}








  /**
   * Registra o quita el Me Gusta sobre la publicación actual
   */
  // toggleLike(): void {
  //   const post = this.publicacion();
  //   const userId = this.usuarioActual()?._id;
  //   if (!post || !userId) return;

  //   if (this.dioMeGusta()) {
  //     this.publicacionesService.quitarMeGusta(post._id).subscribe({
  //       next: () => {
  //         this.publicacion.update((p) => {
  //           if (!p) return null;
  //           return {
  //             ...p,
  //             meGustas: p.meGustas.filter((id) => id !== userId),
  //             cantidadMeGustas: Math.max(0, p.cantidadMeGustas - 1)
  //           };
  //         });
  //       }
  //     });
  //   } else {
  //     this.publicacionesService.darMeGusta(post._id).subscribe({
  //       next: () => {
  //         this.publicacion.update((p) => {
  //           if (!p) return null;
  //           return {
  //             ...p,
  //             meGustas: [...p.meGustas, userId],
  //             cantidadMeGustas: p.cantidadMeGustas + 1
  //           };
  //         });
  //       }
  //     });
  //   }
  // }






// 3. enviarComentario sin romper los controles reactivos (_syncPendingControls)
enviarComentario(): void {
  if (this.nuevoComentarioForm.invalid) {
    this.nuevoComentarioForm.markAllAsTouched();
    return;
  }

  // Obtenemos el ID del post priorizando _id, luego id, y de fallback el parámetro de la URL
  const post = this.publicacion();
  const idDeRuta = this.route.snapshot.paramMap.get('id');
  const postIdentificador = (post as any)?._id || (post as any)?.id || idDeRuta;

  if (!postIdentificador || postIdentificador === 'undefined') {
    console.error('No se encontró el ID de la publicación para comentar');
    return;
  }

  const texto = this.nuevoComentarioForm.controls.texto.value?.trim();
  if (!texto) return;

  this.enviandoComentario.set(true);

  this.comentariosService.crear(postIdentificador, texto).subscribe({
    next: (nuevoComentario) => {
      this.enviandoComentario.set(false);
      this.nuevoComentarioForm.reset({ texto: '' });

      this.comentarios.update((lista) => [nuevoComentario, ...lista]);
      this.totalComentarios.update((t) => t + 1);

      this.publicacion.update((p) => {
        if (!p) return null;
        return {
          ...p,
          cantidadComentarios: (p.cantidadComentarios || 0) + 1
        };
      });
    },
    error: (err) => {
      console.error('Error al enviar comentario:', err);
      this.enviandoComentario.set(false);
    }
  });
}



















  /**
   * Envía un nuevo comentario al backend
   */
  // enviarComentario(): void {
  //   if (this.nuevoComentarioForm.invalid) {
  //     this.nuevoComentarioForm.markAllAsTouched();
  //     return;
  //   }

  //   const post = this.publicacion();
  //   if (!post) return;

  //   this.enviandoComentario.set(true);
  //   const texto = this.nuevoComentarioForm.controls.texto.value;

  //   this.comentariosService.crear(post._id, texto).subscribe({
  //     next: (nuevoComentario) => {
  //       this.enviandoComentario.set(false);
  //       this.nuevoComentarioForm.reset();

  //       // Agregamos el nuevo comentario al inicio del listado reactivo
  //       this.comentarios.update((lista) => [nuevoComentario, ...lista]);
  //       this.totalComentarios.update((t) => t + 1);

  //       // Actualizamos el contador de comentarios en la publicación
  //       this.publicacion.update((p) => {
  //         if (!p) return null;
  //         return { ...p, cantidadComentarios: p.cantidadComentarios + 1 };
  //       });
  //     },
  //     error: () => {
  //       this.enviandoComentario.set(false);
  //     }
  //   });
  // }

  /**
   * Habilita el modo de edición para un comentario propio
   */
  iniciarEdicion(comentario: IComentario): void {
    this.comentarioEnEdicionId.set(comentario._id);
    this.textoEdicionControl.setValue(comentario.texto);
  }

  /**
   * Cancela la edición en línea
   */
  cancelarEdicion(): void {
    this.comentarioEnEdicionId.set(null);
    this.textoEdicionControl.reset();
  }

  /**
   * Guarda los cambios del comentario editado
   */
  guardarEdicion(comentarioId: string): void {
    if (this.textoEdicionControl.invalid) return;

    const nuevoTexto = this.textoEdicionControl.value;

    this.comentariosService.actualizar(comentarioId, nuevoTexto).subscribe({
      next: (comentarioActualizado) => {
        this.comentarios.update((lista) =>
          lista.map((c) => (c._id === comentarioId ? { ...c, texto: nuevoTexto, modificado: true } : c))
        );
        this.cancelarEdicion();
      }
    });
  }

  /**
   * Elimina un comentario (baja lógica)
   */
  eliminarComentario(comentarioId: string): void {
    this.comentariosService.eliminar(comentarioId).subscribe({
      next: () => {
        this.comentarios.update((lista) => lista.filter((c) => c._id !== comentarioId));
        this.totalComentarios.update((t) => Math.max(0, t - 1));

        this.publicacion.update((p) => {
          if (!p) return null;
          return { ...p, cantidadComentarios: Math.max(0, p.cantidadComentarios - 1) };
        });
      }
    });
  }

  /**
   * Comprueba si el usuario puede editar o eliminar un comentario
   */
  esAutorComentario(comentario: IComentario): boolean {
    return this.usuarioActual()?._id === comentario.usuario?._id;
  }

  esAdmin(): boolean {
    return this.usuarioActual()?.perfil === 'administrador';
  }
}
