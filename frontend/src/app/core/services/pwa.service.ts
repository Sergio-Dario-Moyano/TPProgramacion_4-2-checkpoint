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
 * Cómo lo hace: main.ts captura el evento 'beforeinstallprompt' apenas carga la página y lo guarda
 * en window.eventoInstalarPwa (avisando con el evento 'pwa-instalable'). Este servicio lo toma de
 * ahí, pone el signal `disponible` en true y, al llamar a instalar(), abre el cuadro oficial del
 * navegador. Cuando la app se instala (evento 'appinstalled') el botón desaparece.
 * Funciona en Chrome, Edge y Android. Safari (iPhone) y Firefox no disparan este evento.
 */
@Injectable({ providedIn: 'root' })
export class InstalarPwaService {
  private evento: BeforeInstallPromptEvent | null = null;

  /** true cuando el navegador permite instalar la app. */
  disponible = signal(false);

  constructor() {
    // El evento puede haber llegado antes de que exista este servicio (lo guardó main.ts).
    this.tomarEvento();

    // O puede llegar después.
    window.addEventListener('pwa-instalable', () => this.tomarEvento());

    window.addEventListener('appinstalled', () => {
      this.evento = null;
      (window as any).eventoInstalarPwa = null;
      this.disponible.set(false);
    });
  }

  private tomarEvento(): void {
    const guardado = (window as any).eventoInstalarPwa as BeforeInstallPromptEvent | null;
    if (guardado) {
      this.evento = guardado;
      this.disponible.set(true);
    }
  }

  /** Abre el cuadro "¿Instalar Checkpoint?" del navegador. */
  async instalar(): Promise<void> {
    if (!this.evento) return;
    await this.evento.prompt();
    await this.evento.userChoice;
    // El evento solo se puede usar una vez, haya aceptado o no.
    this.evento = null;
    (window as any).eventoInstalarPwa = null;
    this.disponible.set(false);
  }
}
