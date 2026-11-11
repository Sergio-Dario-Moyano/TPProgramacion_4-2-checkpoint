import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ModalService } from '../../shared/components/modal/modal.service';
import { environment } from '../../../environments/environment';

/**
 * Contador de sesión (Sprint 3).
 * Qué hace: Con una sesión de 15 minutos, a los 10 minutos muestra un modal avisando que quedan 5
 * y pregunta si se quiere extender. Si acepta, refresca el token; si no responde, al vencer cierra la sesión.
 * Cómo lo hace: Programa los timers a partir del vencimiento real del token (expiraEn), así funciona
 * igual al iniciar sesión, al refrescar o al volver a entrar con una sesión ya abierta.
 */
@Injectable({ providedIn: 'root' })
export class ContadorService {
  private authService = inject(AuthService);
  private modalService = inject(ModalService);
  private router = inject(Router);

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

  /** Se cumplió el vencimiento del token sin extender la sesión. */
  private expirarSesion(): void {
    if (this.sesionTerminada) return;
    this.sesionTerminada = true;

    if (this.modalAbierto) this.modalService.close(false);
    this.authService.limpiarSesion();

    this.router.navigate(['/login']).then(() => {
      this.modalService.alerta({
        categoria: 'SESIÓN / GAME OVER',
        titulo: 'Tu sesión terminó',
        mensaje: 'Pasaron los 15 minutos sin extender la sesión. Ingresá de nuevo para seguir.',
        textoConfirmar: 'Volver a ingresar',
        tipoIcono: 'timer',
        esPeligro: false
      });
    });
  }

  limpiarTimers(): void {
    if (this.timeoutAviso) clearTimeout(this.timeoutAviso);
    if (this.timeoutFin) clearTimeout(this.timeoutFin);
    this.timeoutAviso = null;
    this.timeoutFin = null;
  }
}




















// // Inyección de dependencias de Angular
// import { Injectable, inject } from '@angular/core';
// // Importamos el servicio de autenticación para cerrar sesión o refrescar el token
// import { AuthService } from './auth.service';
// // Importamos el servicio del modal para presentar la alerta estilizada
// import { ModalService } from '../../shared/components/modal/modal.service';

// /**
//  * Servicio encargado de monitorear el tiempo de actividad de la sesión.
//  * Cumple con la consigna de alertar al usuario a los 10 minutos con una ventana
//  * de 5 minutos antes de la expiración total (token de 15 minutos).
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class ContadorService {
//   // Inyectamos el servicio de autenticación
//   private authService = inject(AuthService);
//   // Inyectamos el servicio del modal para advertir la expiración
//   private modalService = inject(ModalService);

//   // Referencias a los identificadores de setTimeout
//   private timeout10Min: any = null;
//   private timeout5Min: any = null;

//   // Bandera de control para evitar duplicar modales de advertencia en pantalla
//   private modalAbierto: boolean = false;

//   /**
//    * Inicializa el temporizador de 10 minutos de inactividad.
//    * Se invoca al iniciar sesión exitosamente o al validar la sesión en el arranque.
//    */
//   iniciarTemporizador(): void {
//     // Limpiamos cualquier temporizador previo antes de iniciar uno nuevo
//     this.limpiarTimers();

//     // Constante que define los 10 minutos en milisegundos (10 minutos * 60 segundos * 1000 ms)
//     const DIEZ_MINUTOS = 10 * 60 * 1000;

//     // Disparamos el temporizador inicial
//     this.timeout10Min = setTimeout(() => {
//       this.mostrarAlertaExpiracion();
//     }, DIEZ_MINUTOS);
//   }

//   /**
//    * Muestra el modal de confirmación con la cuenta regresiva de 5 minutos
//    * y gestiona la respuesta del usuario para extender o cerrar la sesión.
//    */
//   async mostrarAlertaExpiracion(): Promise<void> {
//     // Si el modal ya está visible en pantalla, no lo abrimos nuevamente
//     if (this.modalAbierto) return;
//     this.modalAbierto = true;

//     // Constante que define los 5 minutos de gracia restantes
//     const CINCO_MINUTOS = 5 * 60 * 1000;

//     // Si pasan los 5 minutos con el modal abierto sin respuesta, cerramos la sesión automáticamente
//     this.timeout5Min = setTimeout(() => {
//       this.modalAbierto = false;
//       this.authService.logout();
//     }, CINCO_MINUTOS);

//     // Abrimos el modal con el diseño y textos acordes al Sprint 3
//     const respuesta = await this.modalService.confirmar({
//       categoria: 'SESIÓN / SPRINT 3',
//       titulo: '¿Seguimos aprendiendo?',
//       mensaje: 'Quedan 5 minutos de sesión. ¿Deseas extenderla?',
//       textoConfirmar: 'Extender sesión',
//       textoCancelar: 'Cerrar sesión',
//       tipoIcono: 'timer',
//       esPeligro: false
//     });

//     // Marcamos que el modal se ha cerrado
//     this.modalAbierto = false;

//     // Si el usuario confirma que desea continuar en la plataforma
//     if (respuesta) {
//       // Cancelamos el temporizador fatal de 5 minutos
//       clearTimeout(this.timeout5Min);

//       // Solicitamos al backend la renovación del token de sesión
//       this.authService.refrescarToken().subscribe({
//         next: () => {
//           // Si el refresco es exitoso, reiniciamos el temporizador por otros 10 minutos
//           this.iniciarTemporizador();
//         },
//         error: () => {
//           // Si el servidor rechaza la renovación, cerramos sesión de inmediato
//           this.authService.logout();
//         }
//       });
//     } else {
//       // Si el usuario hace clic en "Cerrar sesión" o rechaza extenderla
//       clearTimeout(this.timeout5Min);
//       this.authService.logout();
//     }
//   }

//   /**
//    * Cancela todos los temporizadores activos en memoria y reinicia el estado.
//    */
//   limpiarTimers(): void {
//     if (this.timeout10Min) {
//       clearTimeout(this.timeout10Min);
//       this.timeout10Min = null;
//     }
//     if (this.timeout5Min) {
//       clearTimeout(this.timeout5Min);
//       this.timeout5Min = null;
//     }
//     this.modalAbierto = false;
//   }
// }
