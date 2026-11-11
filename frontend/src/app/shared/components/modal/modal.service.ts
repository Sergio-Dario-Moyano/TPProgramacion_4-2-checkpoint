import { Injectable, signal } from '@angular/core';

export interface ModalConfig {
  categoria?: string;
  titulo: string;
  mensaje: string;
  infoSecundaria?: {
    titulo: string;
    subtitulo: string;
  };
  tipoIcono?: 'trash' | 'timer' | 'alert'| 'success'|'logout';
  tipo?: 'alerta' | 'confirmar';
  textoConfirmar?: string;
  textoCancelar?: string;
  esPeligro?: boolean;
}

/**
 * Servicio singleton encargado de gestionar el estado del modal y resolver promesas.
 * Qué hace: Permite disparar modales asíncronos de alerta o confirmación desde cualquier punto del frontend.
 * Cómo lo hace: Mantiene dos Signals ('isOpen' y 'config') y devuelve una Promise que se resuelve
 * en true o false según la interacción del usuario en la interfaz.
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  isOpen = signal<boolean>(false);
  config = signal<ModalConfig | null>(null);

  private responsePromise: { resolve: (val: boolean) => void } | null = null;
  private timeoutId: any = null;

  /**
   * Abre un modal informativo con un único botón de aceptación.
   * Qué hace: Muestra una notificación modal que bloquea la interacción hasta que el usuario acepta.
   * Cómo lo hace: Invoca el método privado open() fijando tipo: 'alerta'.
   */
  alerta(config: Omit<ModalConfig, 'tipo'>): Promise<boolean> {
    return this.open({ ...config, tipo: 'alerta' });
  }

  /**
   * Abre un modal de confirmación con opciones para aceptar o cancelar.
   * Qué hace: Solicita confirmación al usuario (para bajas lógicas o extensión de sesión).
   * Cómo lo hace: Invoca open() con tipo: 'confirmar'.
   */
  confirmar(config: Omit<ModalConfig, 'tipo'>): Promise<boolean> {
    return this.open({ ...config, tipo: 'confirmar' });
  }

  /**
   * Inicializa la configuración del modal y genera la promesa.
   * Qué hace: Pone el modal en estado visible y prepara la resolución asíncrona.
   * Cómo lo hace: Actualiza los Signals config e isOpen, y retorna una nueva Promise guardando el método resolve.
   */
  private open(config: ModalConfig): Promise<boolean> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.config.set(config);
    this.isOpen.set(true);

    return new Promise((resolve) => {
      this.responsePromise = { resolve };
    });
  }

  /**
   * Cierra el modal y despacha la resolución al llamador.
   * Qué hace: Oculta la vista del modal y devuelve el booleano resultante.
   * Cómo lo hace: Setea isOpen en false, resuelve la Promise pendiente y tras 250ms limpia la configuración.
   */
  close(result: boolean): void {
    this.isOpen.set(false);

    if (this.responsePromise) {
      this.responsePromise.resolve(result);
      this.responsePromise = null;
    }

    this.timeoutId = setTimeout(() => {
      this.config.set(null);
    }, 250);
  }
}