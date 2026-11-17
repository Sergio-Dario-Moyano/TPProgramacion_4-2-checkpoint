import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

/** Tiempo mínimo en pantalla para que el usuario vea la carga aunque el backend responda rápido. */
const DURACION_MINIMA_MS = 1400;
const RUTAS_PUBLICAS = ['/login', '/registro', '/cargando'];

const TIPS = [
  'Tip: podés ordenar las publicaciones por cantidad de me gusta.',
  'Tip: marcá la categoría "Busco equipo" para encontrar squad.',
  'Tip: tus publicaciones se pueden editar desde el menú de cada tarjeta.',
  'Tip: el juego de cada publicación aparece como etiqueta.',
  'Tip: desde Mi Perfil podés cambiar tu avatar y tus datos.'
];

/**
 * Pantalla "cargando" (Sprint 3).
 * Qué hace: Se muestra siempre al abrir la app. Mientras tanto valida el token contra
 * POST /auth/autorizar (siempre: es el backend quien decide si la sesión es válida).
 *  - 200 → la sesión es válida: va a publicaciones (o a la página que se pidió).
 *  - 401 → hubo un problema con el token (no hay, es inválido o venció): limpia la sesión y va al login.
 *  - Cualquier otro error (sin conexión, 5xx, etc.) NO es un problema del token: no cierra la
 *    sesión y ofrece reintentar (Render en plan gratuito tarda en "despertar").
 */
@Component({
  selector: 'app-pantalla-cargando',
  standalone: true,
  imports: [LogoComponent],
  templateUrl: './pantalla-cargando.html',
  styleUrl: './pantalla-cargando.css'
})
export class PantallaCargando implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mensaje = signal('Validando tu sesión...');
  tip = signal(TIPS[Math.floor(Math.random() * TIPS.length)]);
  sinConexion = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervaloTips: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervaloTips = setInterval(() => {
      const i = (TIPS.indexOf(this.tip()) + 1) % TIPS.length;
      this.tip.set(TIPS[i]);
    }, 3500);
    this.verificarSesion();
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    if (this.intervaloTips) clearInterval(this.intervaloTips);
  }

  verificarSesion(): void {
    this.sinConexion.set(false);
    this.mensaje.set('Validando tu sesión...');
    const inicio = Date.now();
    const destino = this.route.snapshot.queryParamMap.get('destino') ?? '';

    this.timers.push(
      setTimeout(() => this.mensaje.set('Despertando al servidor, puede tardar unos segundos...'), 6000)
    );

    const despuesDelMinimo = (accion: () => void) => {
      const restante = Math.max(0, DURACION_MINIMA_MS - (Date.now() - inicio));
      this.timers.push(setTimeout(accion, restante));
    };

    // Siempre se consulta al backend. Si no hay token guardado, el pedido viaja igual
    // (puede existir la cookie de sesión) y, si no hay ninguno, el backend responde 401.
    this.auth.autorizarSesion().subscribe({
      next: (res) => {
        despuesDelMinimo(() => {
          this.auth.iniciarSesion({ usuario: res.usuario, expiraEn: res.expiraEn });
          const esPrivada = destino && !RUTAS_PUBLICAS.some((r) => destino.startsWith(r));
          this.router.navigateByUrl(esPrivada ? destino : '/publicaciones', { replaceUrl: true });
        });
      },
      error: (err: HttpErrorResponse) => {
        despuesDelMinimo(() => {
          // 401: token inexistente, inválido o vencido → se cierra la sesión y va al login
          if (err.status === 401) {
            this.auth.limpiarSesion();
            const irARegistro = destino.startsWith('/registro');
            this.router.navigate([irARegistro ? '/registro' : '/login'], { replaceUrl: true });
            return;
          }

          // Otro error: el token no tiene la culpa, así que la sesión NO se borra.
          // status 0 = no hubo respuesta (servidor caído o dormido, sin internet, CORS).
          this.sinConexion.set(true);
          this.mensaje.set(
            err.status === 0
              ? 'No pudimos conectar con el servidor.'
              : `El servidor respondió con un error (${err.status}). Probá de nuevo en unos segundos.`
          );
        });
      }
    });
  }
}
