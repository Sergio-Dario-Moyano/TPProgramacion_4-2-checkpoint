// Importamos utilidades de Angular para componentes standalone, inputs y outputs
import { Component, computed, inject, input, output } from '@angular/core';
// Importamos RouterLink para navegar a la vista detallada
import { RouterLink } from '@angular/router';
// Importamos el modelo tipado de la publicación
import { IPublicacion } from '../../../../core/models/publicacion.interface';
// Importamos el servicio de autenticación para comprobar la autoría y el rol
import { AuthService } from '../../../../core/services/auth.service';
// Importamos las pipes personalizadas de fecha relativa y emoticones
import { TiempoRelativoPipe } from '../../../../shared/pipes/tiempo-relativo.pipe';
import { EmoticonPipe } from '../../../../shared/pipes/emoticon.pipe';

/**
 * Componente standalone que representa individualmente una tarjeta de post en el feed.
 */
@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [RouterLink, TiempoRelativoPipe, EmoticonPipe],
  templateUrl: './publicacion-card.component.html',
  styleUrl: './publicacion-card.component.css'
})
export class PublicacionCardComponent {
  // Inyectamos el servicio de autenticación
  private auth = inject(AuthService);

  // Signal input que recibe la publicación a renderizar
  publicacion = input.required<IPublicacion>();

  // Evento que notifica al componente padre cuando el usuario hace toggle de like
  onLikeToggle = output<string>();

  // Evento que notifica al componente padre cuando se solicita la baja lógica del post
  onEliminar = output<IPublicacion>();

  // Signal computada que obtiene el usuario autenticado
  usuarioActual = computed(() => this.auth.actualUser());

  // Signal computada que determina si el usuario logueado ya le dio "Me Gusta" a este post
  dioMeGusta = computed(() => {
    const userId = this.usuarioActual()?._id;
    if (!userId) return false;
    return this.publicacion().meGustas.includes(userId);
  });

  // Signal computada que verifica si el usuario es el autor del post o si es administrador
  puedeEliminar = computed(() => {
    const user = this.usuarioActual();
    if (!user) return false;
    const esAutor = this.publicacion().usuario?._id === user._id;
    const esAdmin = user.perfil === 'administrador';
    return esAutor || esAdmin;
  });

  /**
   * Emite el ID de la publicación para dar o quitar Me Gusta
   */
  toggleLike(): void {
    this.onLikeToggle.emit(this.publicacion()._id);
  }

  /**
   * Emite la publicación completa para abrir el modal de confirmación de baja lógica
   */
  solicitarEliminacion(): void {
    this.onEliminar.emit(this.publicacion());
  }
}
