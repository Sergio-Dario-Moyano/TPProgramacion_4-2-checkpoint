// Inyección de dependencias
import { Injectable, inject } from '@angular/core';
// Cliente HTTP
import { HttpClient } from '@angular/common/http';
// Entorno con la URL base
import { environment } from '../../../environments/environment';
// Flujo Observable
import { Observable } from 'rxjs';
// Modelo tipado de usuario
import { IUsuario } from '../models/auth.interface';

/**
 * Servicio administrativo para la gestión de usuarios:
 * listado de cuentas, alta directa desde el panel y control de estado (alta/baja lógica).
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  // Inyección de HttpClient
  private http = inject(HttpClient);
  // URL base para las rutas administrativas de usuarios
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/usuarios`;

  /**
   * Obtiene la lista completa de usuarios registrados (requiere rol administrador).
   */
  listarTodos(): Observable<{ usuarios: IUsuario[] }> {
    return this.http.get<{ usuarios: IUsuario[] }>(this.API_URL);
  }

  /**
   * Crea un nuevo usuario desde el panel administrativo enviando FormData (incluye foto de perfil).
   * Permite asignar rol de 'usuario' o 'administrador'.
   */
  crearUsuario(formData: FormData): Observable<any> {
    return this.http.post(this.API_URL, formData);
  }

  /**
   * Realiza la baja lógica de un usuario (activo = false).
   * El usuario deshabilitado no podrá iniciar sesión y será notificado.
   */
  deshabilitar(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  /**
   * Realiza el alta lógica, rehabilitando una cuenta deshabilitada (activo = true).
   */
  habilitar(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/restaurar`, {});
  }
}
