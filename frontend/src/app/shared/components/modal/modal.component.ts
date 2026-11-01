// Importamos el decorador Component y la función inject
import { Component, inject } from '@angular/core';
// Importamos el servicio del modal y su configuración
import { ModalService } from './modal.service';

/**
 * Componente standalone que renderiza el modal global del sistema sobre la pantalla activa.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  // Inyectamos el servicio del modal
  private modalService = inject(ModalService);

  // Getter que lee el Signal de visibilidad
  get isOpen() {
    return this.modalService.isOpen();
  }

  // Getter que lee el Signal con la configuración activa
  get config() {
    return this.modalService.config();
  }

  /**
   * Manejador de clic cuando el usuario confirma la acción del modal.
   */
  confirmar(): void {
    this.modalService.close(true);
  }

  /**
   * Manejador de clic cuando el usuario cancela o cierra el modal.
   */
  cancelar(): void {
    this.modalService.close(false);
  }
}
