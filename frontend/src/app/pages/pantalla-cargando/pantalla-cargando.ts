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
 * POST /auth/autorizar. Si es válido va a publicaciones (o a la página que se pidió);
 * si no (401), va al login.
 * Si el servidor no responde (Render en plan gratuito tarda en "despertar"), ofrece reintentar.
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

    // Sin token guardado no hay sesión que validar: se evita una petición que daría 401
    if (!this.auth.token) {
      despuesDelMinimo(() => {
        this.auth.limpiarSesion();
        this.router.navigate([destino.startsWith('/registro') ? '/registro' : '/login'], { replaceUrl: true });
      });
      return;
    }

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
          // status 0 = no hubo respuesta del servidor (caído, sin internet, CORS)
          if (err.status === 0) {
            this.sinConexion.set(true);
            this.mensaje.set('No pudimos conectar con el servidor.');
            return;
          }
          // 401: token inexistente, inválido o vencido → login (o registro si lo pidió)
          this.auth.limpiarSesion();
          const irARegistro = destino.startsWith('/registro');
          this.router.navigate([irARegistro ? '/registro' : '/login'], { replaceUrl: true });
        });
      }
    });
  }
}
