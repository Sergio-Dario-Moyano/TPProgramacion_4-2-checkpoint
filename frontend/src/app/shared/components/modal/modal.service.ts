// Importamos los decoradores y funciones reactivas Signal de Angular
import { Injectable, signal } from '@angular/core';

/**
 * Interfaz que define las propiedades configurables para desplegar un modal en pantalla.
 */
export interface ModalConfig {
  // Etiqueta superior en rojo monoespaciado (ej: 'MODERACIÓN / CONFIRMACIÓN' o 'SESIÓN / SPRINT 3')
  categoria?: string;
  // Título principal del modal
  titulo: string;
  // Mensaje descriptivo o advertencia explicativa
  mensaje: string;
  // Bloque opcional de previsualización para publicaciones a dar de baja
  infoSecundaria?: {
    titulo: string;
    subtitulo: string;
  };
  // Tipo de icono a mostrar en el cuadro superior: 'trash' (tacho), 'timer' (reloj) o 'alert' (alerta)
  tipoIcono?: 'trash' | 'timer' | 'alert';
  // Tipo de acción: 'alerta' (solo botón confirmar) o 'confirmar' (botones cancelar y confirmar)
  tipo?: 'alerta' | 'confirmar';
  // Texto personalizado para el botón de confirmación
  textoConfirmar?: string;
  // Texto personalizado para el botón de cancelación
  textoCancelar?: string;
  // Determina si el botón de acción principal debe pintarse con color de peligro (rojo)
  esPeligro?: boolean;
}

/**
 * Servicio singleton encargado de gestionar el estado reactivo y las resoluciones de promesas del modal.
 */
@Injectable({
  providedIn: 'root'
})
export class ModalService {
  // Signal booleano que determina si el modal está abierto o cerrado
  isOpen = signal<boolean>(false);

  // Signal que contiene la configuración actual del modal desplegado
  config = signal<ModalConfig | null>(null);

  // Almacena la función resolve de la Promise para devolver la respuesta del usuario (true o false)
  private responsePromise: { resolve: (val: boolean) => void } | null = null;

  // Identificador de timeout para limpiar la configuración tras la animación de cierre
  private timeoutId: any = null;

  /**
   * Abre un modal en modo informativo o alerta (un solo botón de aceptación).
   */
  alerta(config: Omit<ModalConfig, 'tipo'>): Promise<boolean> {
    return this.open({ ...config, tipo: 'alerta' });
  }

  /**
   * Abre un modal en modo confirmación (ofrece aceptar o cancelar la acción).
   */
  confirmar(config: Omit<ModalConfig, 'tipo'>): Promise<boolean> {
    return this.open({ ...config, tipo: 'confirmar' });
  }

  /**
   * Método privado que actualiza el estado reactivo e inicializa la Promesa asíncrona.
   */
  private open(config: ModalConfig): Promise<boolean> {
    // Si había un temporizador de limpieza previo pendiente, lo cancelamos
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Cargamos los datos de configuración al Signal
    this.config.set(config);
    // Activamos la visibilidad del modal
    this.isOpen.set(true);

    // Retornamos una promesa que se resolverá cuando el usuario presione una acción
    return new Promise((resolve) => {
      this.responsePromise = { resolve };
    });
  }

  /**
   * Cierra el modal y notifica el resultado boolean al código que lo invocó.
   */
  close(result: boolean): void {
    // Desactivamos la visibilidad inmediatamente para iniciar la transición de salida
    this.isOpen.set(false);

    // Si existe una promesa esperando respuesta, la resolvemos con el valor elegido
    if (this.responsePromise) {
      this.responsePromise.resolve(result);
      this.responsePromise = null;
    }

    // Esperamos 250ms a que termine la animación visual para limpiar la configuración
    this.timeoutId = setTimeout(() => {
      this.config.set(null);
    }, 250);
  }
}
