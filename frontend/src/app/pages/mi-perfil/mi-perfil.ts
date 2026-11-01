// Importamos módulos esenciales del ciclo de vida, señales y reactividad de Angular
import { Component, computed, inject, OnInit, signal } from '@angular/core';
// Importamos RouterLink para volver al feed o interactuar con enlaces
import { RouterLink } from '@angular/router';
// Importamos el servicio de autenticación para consultar el usuario en sesión
import { AuthService } from '../../core/services/auth.service';
// Importamos el servicio de publicaciones para traer las publicaciones del usuario
import { PublicacionesService } from '../../core/services/publicaciones.service';
// Importamos el servicio de modales para confirmar la baja lógica de posts propios
import { ModalService } from '../../shared/components/modal/modal.service';
// Importamos la interfaz del modelo de publicación
import { IPublicacion } from '../../core/models/publicacion.interface';
// Importamos la tarjeta reutilizable de post
import { PublicacionCardComponent } from '../publicaciones/components/publicacion-card/publicacion-card.component';
// Importamos la pipe personalizada de fechas
import { FormatearFechaPipe } from '../../shared/pipes/formatear-fecha.pipe';
// Importamos el componente Spinner para indicar el estado de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

/**
 * Componente standalone que representa la vista del perfil del usuario logueado.
 */
@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [
    RouterLink,
    PublicacionCardComponent,
    FormatearFechaPipe,
    SpinnerComponent
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css'
})
export class MiPerfil implements OnInit {
  // Inyectamos el servicio de autenticación
  private auth = inject(AuthService);
  // Inyectamos el servicio de publicaciones
  private publicacionesService = inject(PublicacionesService);
  // Inyectamos el servicio de modales del sistema
  private modalService = inject(ModalService);

  // Signal computada que obtiene los datos del usuario autenticado
  usuarioActual = computed(() => this.auth.actualUser());

  // Signal reactiva que contiene las últimas 3 publicaciones del usuario
  ultimasPublicaciones = signal<IPublicacion[]>([]);

  // Signal booleana para mostrar el spinner mientras se obtienen los datos
  loading = signal<boolean>(true);

  // Signal computada que verifica si el usuario autenticado es administrador
  esAdmin = computed(() => this.usuarioActual()?.perfil === 'administrador');

  ngOnInit(): void {
    // Al montar el componente, cargamos las publicaciones asociadas al usuario
    this.cargarMisPublicaciones();
  }

  /**
   * Consulta al backend las publicaciones creadas por el usuario autenticado.
   * Se limita explícitamente a 3 elementos por requerimiento de la consigna del Sprint 2.
   */
  cargarMisPublicaciones(): void {
    const usuario = this.usuarioActual();
    if (!usuario) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    // Invocamos el método listar pasando offset=0, limit=3, orden='fecha' y el ID del usuario
    this.publicacionesService
      .listar(0, 3, 'fecha', usuario._id)
      .subscribe({
        next: (res) => {
          // Asignamos las publicaciones devueltas a la señal reactiva
          this.ultimasPublicaciones.set(res.publicaciones || []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  /**
   * Alterna el estado de Me Gusta en una publicación propia
   */
  onToggleLike(publicacionId: string): void {
    const post = this.ultimasPublicaciones().find((p) => p._id === publicacionId);
    const userId = this.usuarioActual()?._id;
    if (!post || !userId) return;

    const yaDioLike = post.meGustas.includes(userId);

    if (yaDioLike) {
      // Quitar Me Gusta
      this.publicacionesService.quitarMeGusta(publicacionId).subscribe({
        next: () => {
          this.ultimasPublicaciones.update((posts) =>
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
          this.ultimasPublicaciones.update((posts) =>
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
          // Eliminamos la publicación de la lista reactiva
          this.ultimasPublicaciones.update((posts) => posts.filter((p) => p._id !== publicacion._id));
        }
      });
    }
  }
}
