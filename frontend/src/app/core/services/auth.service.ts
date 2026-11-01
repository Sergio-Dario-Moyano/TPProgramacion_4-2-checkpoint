// Importamos utilidades reactivas y de inyección de Angular
import { computed, inject, Injectable, signal, WritableSignal, Injector } from '@angular/core';
// Importamos el cliente HTTP y la clase HttpContext para pasar metadatos en peticiones
import { HttpClient, HttpContext } from '@angular/common/http';
// Importamos Observable desde RxJS para manejar el flujo asíncrono
import { Observable } from 'rxjs';
// Importamos la configuración del entorno para obtener la URL del backend
import { environment } from '../../../environments/environment';
// Importamos los modelos de datos tipados de autenticación y usuario
import { ILogin, IUsuario } from '../models/auth.interface';
// Importamos el enrutador para redirigir al usuario tras el cierre de sesión
import { Router } from '@angular/router';
// Importamos el servicio del contador para reiniciar y pausar temporizadores
import { ContadorService } from './contador.service';
// Importamos el token que permite omitir el interceptor HTTP cuando sea necesario
import { SKIP_INTERCEPTOR } from '../interceptors/http-context-tokens';

/**
 * Servicio encargado de la gestión integral de la sesión del usuario,
 * llamadas a la API de autenticación y persistencia del estado reactivo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Inyectamos el cliente HTTP de Angular para realizar las solicitudes al servidor
  private http = inject(HttpClient);
  // Inyectamos el enrutador de Angular
  private router = inject(Router);
  // Inyectamos el Injector para resolver dependencias circulares diferidas
  private injector = inject(Injector);

  // Definimos la URL base de los endpoints del backend tomando la variable de entorno
  readonly API_URL = environment.apiUrl || 'http://localhost:3000';

  // Signal modificable que almacena los datos del usuario logueado en tiempo real
  actualUser: WritableSignal<IUsuario | null> = signal<IUsuario | null>(null);

  // Señal calculada (computed) que determina de forma booleana si hay una sesión activa
  isAuthenticated = computed(() => this.actualUser() !== null);

  constructor() {
    // Al inicializar el servicio, verificamos si existe un usuario previamente persistido en el navegador
    const storedUser = localStorage.getItem('usuarioActual');
    // Si existe el registro en localStorage, lo parseamos y lo cargamos al Signal
    if (storedUser) {
      try {
        this.actualUser.set(JSON.parse(storedUser));
      } catch (e) {
        // En caso de datos corruptos, limpiamos el almacenamiento local
        localStorage.removeItem('usuarioActual');
      }
    }
  }

  /**
   * Envía la solicitud de registro con datos multipart (FormData) al backend.
   * Permite adjuntar la foto de perfil para procesarla directamente con Cloudinary.
   */
  registro(formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/registro`, formData);
  }

  /**
   * Envía las credenciales (correo o usuario y contraseña) para iniciar sesión.
   * El backend responde con el usuario y setea la cookie HttpOnly con el JWT.
   */
  login(credentials: ILogin): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/login`, credentials);
  }

  /**
   * Valida la cookie de sesión contra el servidor al abrir la aplicación.
   * Utiliza SKIP_INTERCEPTOR para evitar que el interceptor capture errores de forma anticipada.
   */
  autorizarSesion(): Observable<any> {
    return this.http.post(
      `${this.API_URL}/auth/autorizar`,
      {},
      {
        context: new HttpContext().set(SKIP_INTERCEPTOR, true)
      }
    );
  }

  /**
   * Solicita un nuevo token JWT antes de que venza el actual por inactividad.
   */
  refrescarToken(): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/refrescar`, {});
  }

  /**
   * Actualiza el Signal del usuario logueado y persiste la información en localStorage.
   */
  setUsuarioActual(usuario: IUsuario): void {
    this.actualUser.set(usuario);
    localStorage.setItem('usuarioActual', JSON.stringify(usuario));
  }

  /**
   * Cierra la sesión activa:
   * 1. Elimina los datos de localStorage.
   * 2. Limpia el Signal en memoria.
   * 3. Detiene los temporizadores de inactividad.
   * 4. Llama al endpoint de backend para destruir la cookie HttpOnly.
   * 5. Redirige a la pantalla de login.
   */
  logout(): void {
    // Eliminamos el usuario del almacenamiento local
    localStorage.removeItem('usuarioActual');

    // Vaciamos el Signal reactivo del usuario
    this.actualUser.set(null);

    // Obtenemos el ContadorService a través del injector para evitar dependencias circulares
    const contadorService = this.injector.get(ContadorService);
    // Limpiamos los timers pendientes
    contadorService.limpiarTimers();

    // Enviamos la petición de deslogueo al servidor para borrar la cookie de autorización
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
