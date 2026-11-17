import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ILogin,
  IRespuestaAutorizar,
  IRespuestaSesion,
  IUsuario
} from '../models/auth.interface';
import { SKIP_INTERCEPTOR } from '../interceptors/http-context-tokens';
import { ContadorService } from './contador.service';

/** Clave de localStorage donde se guarda el JWT (Sprint 3). */
const CLAVE_TOKEN = 'checkpoint_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private injector = inject(Injector);

  readonly API_URL = environment.apiUrl || 'http://localhost:3000';

  /** Usuario logueado (null = sin sesión). */
  actualUser = signal<IUsuario | null>(null);

  /**
   * Indica si ya se consultó al backend si la sesión es válida.
   * Mientras sea false, los guards mandan a la pantalla "cargando" (Sprint 3).
   */
  sesionVerificada = signal<boolean>(false);

  /**
   * true cuando el token ya venció pero el usuario sigue viendo la pantalla.
   * No se lo saca automáticamente: recién cuando haga algo que consulte al backend
   * (ver otra publicación, dar me gusta, comentar...) el backend responde 401 y el
   * interceptor avisa y lo manda al login. Mientras tanto se pausa la actualización en vivo.
   */
  sesionVencida = signal<boolean>(false);

  isAuthenticated = computed(() => this.actualUser() !== null);
  esAdmin = computed(() => this.actualUser()?.perfil === 'administrador');

  /** Token guardado localmente en el navegador. */
  get token(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  }

  private get contador(): ContadorService {
    // Se resuelve en el momento para evitar una dependencia circular con ContadorService
    return this.injector.get(ContadorService);
  }

  // -----------------------------------------------------------------
  // Peticiones
  // -----------------------------------------------------------------

  registro(formData: FormData): Observable<IRespuestaSesion> {
    return this.http.post<IRespuestaSesion>(`${this.API_URL}/auth/registro`, formData);
  }

  login(credenciales: ILogin): Observable<IRespuestaSesion> {
    return this.http.post<IRespuestaSesion>(`${this.API_URL}/auth/login`, credenciales);
  }

  /** POST /auth/autorizar: valida el token sin disparar el manejo global de 401. */
  autorizarSesion(): Observable<IRespuestaAutorizar> {
    return this.http.post<IRespuestaAutorizar>(
      `${this.API_URL}/auth/autorizar`,
      {},
      { context: new HttpContext().set(SKIP_INTERCEPTOR, true) }
    );
  }

  /** POST /auth/refrescar: devuelve un token nuevo de 15 minutos. */
  refrescarToken(): Observable<IRespuestaSesion> {
    return this.http.post<IRespuestaSesion>(`${this.API_URL}/auth/refrescar`, {});
  }

  // -----------------------------------------------------------------
  // Estado de la sesión
  // -----------------------------------------------------------------

  /**
   * Abre (o renueva) la sesión en el front.
   * Guarda el token en localStorage, carga el usuario y arranca el contador de sesión.
   */
  iniciarSesion(datos: { usuario: IUsuario; expiraEn: number; token?: string }): void {
    if (datos.token) {
      try {
        localStorage.setItem(CLAVE_TOKEN, datos.token);
      } catch {
        /* Navegación privada sin storage: queda la cookie HttpOnly como respaldo */
      }
    }
    this.actualUser.set(datos.usuario);
    this.sesionVerificada.set(true);
    this.sesionVencida.set(false);
    this.contador.iniciarTemporizador(datos.expiraEn);
  }

  /** Actualiza los datos del usuario (por ejemplo, después de editar el perfil). */
  actualizarUsuario(usuario: IUsuario): void {
    this.actualUser.set(usuario);
  }

  /** Borra todo rastro de la sesión en el front, sin navegar. */
  limpiarSesion(): void {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* sin storage disponible */
    }
    this.actualUser.set(null);
    this.sesionVerificada.set(true);
    this.sesionVencida.set(false);
    this.contador.limpiarTimers();
  }

  /** Cierra la sesión en el backend (borra la cookie) y vuelve al login. */
  logout(): void {
    this.http
      .post(`${this.API_URL}/auth/logout`, {}, { context: new HttpContext().set(SKIP_INTERCEPTOR, true) })
      .subscribe({ error: () => undefined });
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }
}
























