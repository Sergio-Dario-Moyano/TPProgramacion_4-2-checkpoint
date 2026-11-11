import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IPublicacion } from '../../../../core/models/publicacion.interface';
import { AuthService } from '../../../../core/services/auth.service';
import { yaDioMeGusta } from '../../../../core/utils/me-gusta';
import { TiempoRelativoPipe } from '../../../../shared/pipes/tiempo-relativo.pipe';
import { AbreviarNumeroPipe } from '../../../../shared/pipes/abreviar-numero.pipe';
import { CategoriaPipe } from '../../../../shared/pipes/categoria.pipe';
import { ImagenFallbackDirective } from '../../../../shared/directives/imagen-fallback.directive';

/**
 * Tarjeta de publicación (Sprint 2: "cada publicación debe ser un componente").
 * Solo muestra datos y emite eventos; la página que la usa decide qué hacer.
 */
@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [RouterLink, DatePipe, TiempoRelativoPipe, AbreviarNumeroPipe, CategoriaPipe, ImagenFallbackDirective],
  templateUrl: './publicacion-card.component.html',
  styleUrl: './publicacion-card.component.css'
})
export class PublicacionCardComponent {
  private auth = inject(AuthService);

  publicacion = input.required<IPublicacion>();

  onLikeToggle = output<string>();
  onEditar = output<IPublicacion>();
  onEliminar = output<IPublicacion>();

  private usuarioActual = computed(() => this.auth.actualUser());

  dioMeGusta = computed(() => yaDioMeGusta(this.publicacion(), this.usuarioActual()?._id));

  esAutor = computed(() => {
    const autorId = this.publicacion().usuario?._id ?? (this.publicacion().usuario as unknown as string);
    return !!autorId && autorId.toString() === this.usuarioActual()?._id;
  });

  /** El autor puede eliminar lo suyo; un administrador puede dar de baja cualquier publicación (Sprint 4). */
  puedeEliminar = computed(() => this.esAutor() || this.auth.esAdmin());

  /** Baja hecha por un administrador sobre una publicación ajena. */
  esModeracion = computed(() => !this.esAutor() && this.auth.esAdmin());
}
