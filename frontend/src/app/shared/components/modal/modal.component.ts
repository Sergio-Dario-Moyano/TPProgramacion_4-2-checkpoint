import { Component, inject } from '@angular/core';
import { ModalService } from './modal.service';

/**
 * Componente standalone que renderiza el modal global del sistema.
 * Qué hace: Muestra la ventana modal sobre la vista activa cuando isOpen() es true.
 * Cómo lo hace: Lee la configuración reactiva desde ModalService y delega el resultado de confirmación o cancelación.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  private modalService = inject(ModalService);

  get isOpen() {
    return this.modalService.isOpen();
  }

  get config() {
    return this.modalService.config();
  }

  /**
   * Resuelve el modal en true al presionar aceptar/confirmar.
   * Qué hace: Notifica al servicio que la acción fue confirmada.
   * Cómo lo hace: Ejecuta modalService.close(true).
   */
  confirmar(): void {
    this.modalService.close(true);
  }

  /**
   * Resuelve el modal en false al presionar cancelar o hacer clic en backdrop/cruz.
   * Qué hace: Notifica al servicio que la acción fue cancelada.
   * Cómo lo hace: Ejecuta modalService.close(false).
   */
  cancelar(): void {
    this.modalService.close(false);
  }
}