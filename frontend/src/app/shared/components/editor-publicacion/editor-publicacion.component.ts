import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIAS, CategoriaPublicacion, IPublicacion } from '../../../core/models/publicacion.interface';
import { PublicacionesService } from '../../../core/services/publicaciones.service';
import { SoltarArchivoDirective } from '../../directives/soltar-archivo.directive';
import { AutoResizeDirective } from '../../directives/auto-resize.directive';
import { TAMANO_MAXIMO_IMAGEN, TIPOS_IMAGEN } from '../formulario-usuario/formulario-usuario.component';

/**
 * Editor de publicación (modal).
 * Permite al autor cambiar título, mensaje, categoría, juego e imagen (reemplazarla o quitarla).
 * Al guardar llama a PUT /publicaciones/:id y emite la publicación actualizada.
 */
@Component({
  selector: 'app-editor-publicacion',
  standalone: true,
  imports: [ReactiveFormsModule, AutoResizeDirective, SoltarArchivoDirective],
  templateUrl: './editor-publicacion.component.html',
  styleUrl: './editor-publicacion.component.css'
})
export class EditorPublicacionComponent implements OnInit {
  private publicacionesService = inject(PublicacionesService);

  publicacion = input.required<IPublicacion>();
  guardado = output<IPublicacion>();
  cerrar = output<void>();

  readonly categorias = CATEGORIAS;
  guardando = signal(false);
  error = signal<string | null>(null);

  /** Imagen que se ve en el editor: la actual, la nueva elegida o ninguna. */
  previewImagen = signal<string | null>(null);
  private archivoNuevo: File | null = null;
  private quitarImagen = false;

  form = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(500)] }),
    categoria: new FormControl<CategoriaPublicacion>('general', { nonNullable: true }),
    juego: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] })
  });

  ngOnInit(): void {
    const p = this.publicacion();
    this.form.setValue({
      titulo: p.titulo,
      descripcion: p.descripcion,
      categoria: p.categoria ?? 'general',
      juego: p.juego ?? ''
    });
    this.previewImagen.set(p.imagenUrl ?? null);
  }

  onFileSelected(event: Event): void {
    const inputArchivo = event.target as HTMLInputElement;
    const file = inputArchivo.files?.[0];
    inputArchivo.value = '';
    if (file) this.cargarImagen(file);
  }

  /** Valida y carga la imagen, elegida con el botón o soltada con arrastrar y soltar. */
  cargarImagen(file: File): void {

    if (!TIPOS_IMAGEN.includes(file.type)) {
      this.error.set('La imagen debe ser JPG, PNG o WEBP.');
      return;
    }
    if (file.size > TAMANO_MAXIMO_IMAGEN) {
      this.error.set('La imagen no puede superar los 5 MB.');
      return;
    }

    this.error.set(null);
    this.archivoNuevo = file;
    this.quitarImagen = false;
    const reader = new FileReader();
    reader.onload = (e) => this.previewImagen.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  eliminarImagen(): void {
    this.archivoNuevo = null;
    this.quitarImagen = !!this.publicacion().imagenUrl;
    this.previewImagen.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('El título y el mensaje son obligatorios.');
      return;
    }

    const v = this.form.getRawValue();
    const formData = new FormData();
    formData.append('titulo', v.titulo.trim());
    formData.append('descripcion', v.descripcion.trim());
    formData.append('categoria', v.categoria);
    formData.append('juego', v.juego.trim());
    if (this.archivoNuevo) formData.append('file', this.archivoNuevo);
    if (this.quitarImagen) formData.append('quitarImagen', 'true');

    this.guardando.set(true);
    this.error.set(null);

    this.publicacionesService.actualizar(this.publicacion()._id, formData).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res.publicacion);
      },
      error: (err) => {
        this.guardando.set(false);
        const msg = err?.error?.message;
        this.error.set(Array.isArray(msg) ? msg.join(' ') : msg ?? 'No se pudo guardar la publicación.');
      }
    });
  }
}
