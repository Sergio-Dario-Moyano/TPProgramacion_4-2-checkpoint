import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import { environment } from '../../../environments/environment';

/**
 * Contador de sesión (Sprint 3).
 * Qué hace: Con una sesión de 15 minutos, a los 10 minutos muestra un modal avisando que quedan 5
 * y pregunta si se quiere extender. Si acepta, refresca el token. Si no responde, al vencer NO lo
 * saca de la pantalla: marca la sesión como vencida y el 401 llega recién cuando el usuario
 * hace algo que consulta al backend (el interceptor avisa y lo manda al login).
 * Cómo lo hace: Programa los timers a partir del vencimiento real del token (expiraEn), así funciona
 * igual al iniciar sesión, al refrescar o al volver a entrar con una sesión ya abierta.
 */
@Injectable({ providedIn: 'root' })
export class ContadorService {
  private authService = inject(AuthService);
  private modalService = inject(ModalService);

  private timeoutAviso: ReturnType<typeof setTimeout> | null = null;
  private timeoutFin: ReturnType<typeof setTimeout> | null = null;
  private modalAbierto = false;
  private sesionTerminada = false;

  private readonly duracionSesionMs = (environment.sesionMinutos ?? 15) * 60 * 1000;
  /** Anticipación del aviso: 5 de 15 minutos (un tercio de la sesión). */
  private readonly anticipacionAvisoMs = this.duracionSesionMs / 3;

  iniciarTemporizador(expiraEn: number): void {
    this.limpiarTimers();
    this.sesionTerminada = false;

    const ahora = Date.now();
    const msHastaFin = expiraEn - ahora;
    if (msHastaFin <= 0) {
      this.expirarSesion();
      return;
    }

    const msHastaAviso = Math.max(0, msHastaFin - this.anticipacionAvisoMs);
    this.timeoutAviso = setTimeout(() => this.mostrarAvisoExpiracion(expiraEn), msHastaAviso);
    this.timeoutFin = setTimeout(() => this.expirarSesion(), msHastaFin);
  }

  private formatearRestante(ms: number): string {
    const minutos = Math.round(ms / 60000);
    if (minutos >= 1) return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    return `${Math.max(1, Math.round(ms / 1000))} segundos`;
  }

  private async mostrarAvisoExpiracion(expiraEn: number): Promise<void> {
    if (this.modalAbierto || this.sesionTerminada) return;
    this.modalAbierto = true;

    const respuesta = await this.modalService.confirmar({
      categoria: 'SESIÓN / TIEMPO EXTRA',
      titulo: '¿Seguimos jugando?',
      mensaje: `Quedan ${this.formatearRestante(expiraEn - Date.now())} de sesión. ¿Querés extenderla 15 minutos más?`,
      textoConfirmar: 'Extender sesión',
      textoCancelar: 'Cerrar sesión',
      tipoIcono: 'timer',
      esPeligro: false
    });

    this.modalAbierto = false;
    if (this.sesionTerminada) return; // Venció mientras el modal estaba abierto

    if (respuesta) {
      this.authService.refrescarToken().subscribe({
        next: (res) => this.authService.iniciarSesion(res)
        // Si el refresco devuelve 401, el interceptor redirige al login
      });
    } else {
      this.authService.logout();
    }
  }

  /**
   * Se cumplió el vencimiento del token sin extender la sesión.
   * Qué hace: Deja al usuario en la pantalla donde está, con la sesión marcada como vencida.
   * Cómo lo hace: Cierra el modal de aviso si seguía abierto y pone authService.sesionVencida en
   * true (eso pausa la actualización en vivo). No borra la sesión ni navega: la próxima acción del
   * usuario va al backend con el token vencido, recibe 401 y el interceptor lo manda al login.
   */
  private expirarSesion(): void {
    if (this.sesionTerminada) return;
    this.sesionTerminada = true;
    if (this.modalAbierto) this.modalService.close(false);
    this.authService.sesionVencida.set(true);
  }

  limpiarTimers(): void {
    if (this.timeoutAviso) clearTimeout(this.timeoutAviso);
    if (this.timeoutFin) clearTimeout(this.timeoutFin);
    this.timeoutAviso = null;
    this.timeoutFin = null;
  }
}




















