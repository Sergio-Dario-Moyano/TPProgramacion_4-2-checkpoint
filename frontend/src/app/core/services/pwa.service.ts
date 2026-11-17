import { Injectable, signal } from '@angular/core';

/**
 * Evento que dispara el navegador cuando la app se puede instalar.
 * No viene tipado en TypeScript, por eso se define acá.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * Instalación de la PWA.
 * Qué hace: Permite mostrar un botón propio "Instalar app" en lugar de depender del ícono
 * de la barra de direcciones del navegador.
 * Cómo lo hace: Escucha el evento 'beforeinstallprompt', lo guarda y pone el signal `disponible`
 * en true. Al llamar a instalar() abre el cuadro oficial del navegador. Cuando la app se instala
 * (evento 'appinstalled') el botón desaparece.
 * Funciona en Chrome, Edge y Android. Safari (iPhone) y Firefox no disparan este evento.
 */
@Injectable({ providedIn: 'root' })
export class InstalarPwaService {
  private evento: BeforeInstallPromptEvent | null = null;

  /** true cuando el navegador permite instalar la app. */
  disponible = signal(false);

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault(); // evita el aviso automático del navegador; lo mostramos con el botón
      this.evento = e as BeforeInstallPromptEvent;
      this.disponible.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.evento = null;
      this.disponible.set(false);
    });
  }

  /** Abre el cuadro "¿Instalar Checkpoint?" del navegador. */
  async instalar(): Promise<void> {
    if (!this.evento) return;
    await this.evento.prompt();
    await this.evento.userChoice;
    // El evento solo se puede usar una vez, haya aceptado o no.
    this.evento = null;
    this.disponible.set(false);
  }
}
