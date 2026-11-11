import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IRespuestaSesion, IUsuario, RolUsuario } from '../models/auth.interface';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/usuarios`;

  // ---------------- Mi perfil ----------------

  /** PUT /usuarios/perfil: devuelve el usuario actualizado y un token nuevo. */
  actualizarPerfil(formData: FormData): Observable<IRespuestaSesion> {
    return this.http.put<IRespuestaSesion>(`${this.API_URL}/perfil`, formData);
  }

  cambiarPassword(datos: {
    passwordActual: string;
    passwordNueva: string;
    repetirPassword: string;
  }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/perfil/password`, datos);
  }

  // ---------------- Dashboard (Sprint 4) ----------------

  listar(busqueda = '', estado: 'todos' | 'activos' | 'inactivos' = 'todos'): Observable<{ usuarios: IUsuario[]; total: number }> {
    let params = new HttpParams().set('estado', estado);
    if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
    return this.http.get<{ usuarios: IUsuario[]; total: number }>(this.API_URL, { params });
  }

  crear(formData: FormData): Observable<{ message: string; usuario: IUsuario }> {
    return this.http.post<{ message: string; usuario: IUsuario }>(this.API_URL, formData);
  }

  deshabilitar(id: string): Observable<{ message: string; usuario: IUsuario }> {
    return this.http.delete<{ message: string; usuario: IUsuario }>(`${this.API_URL}/${id}`);
  }

  habilitar(id: string): Observable<{ message: string; usuario: IUsuario }> {
    return this.http.post<{ message: string; usuario: IUsuario }>(`${this.API_URL}/${id}/habilitar`, {});
  }

  /** PATCH /usuarios/:id/perfil: convierte a un usuario existente en administrador o al revés. */
  cambiarRol(id: string, perfil: RolUsuario): Observable<{ message: string; usuario: IUsuario }> {
    return this.http.patch<{ message: string; usuario: IUsuario }>(`${this.API_URL}/${id}/perfil`, { perfil });
  }
}














// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpParams } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../../../environments/environment';
// import { IRespuestaSesion, IUsuario } from '../models/auth.interface';

// @Injectable({ providedIn: 'root' })
// export class UsuariosService {
//   private http = inject(HttpClient);
//   private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/usuarios`;

//   // ---------------- Mi perfil ----------------

//   /** PUT /usuarios/perfil: devuelve el usuario actualizado y un token nuevo. */
//   actualizarPerfil(formData: FormData): Observable<IRespuestaSesion> {
//     return this.http.put<IRespuestaSesion>(`${this.API_URL}/perfil`, formData);
//   }

//   cambiarPassword(datos: {
//     passwordActual: string;
//     passwordNueva: string;
//     repetirPassword: string;
//   }): Observable<{ message: string }> {
//     return this.http.put<{ message: string }>(`${this.API_URL}/perfil/password`, datos);
//   }

//   // ---------------- Dashboard (Sprint 4) ----------------

//   listar(busqueda = '', estado: 'todos' | 'activos' | 'inactivos' = 'todos'): Observable<{ usuarios: IUsuario[]; total: number }> {
//     let params = new HttpParams().set('estado', estado);
//     if (busqueda.trim()) params = params.set('busqueda', busqueda.trim());
//     return this.http.get<{ usuarios: IUsuario[]; total: number }>(this.API_URL, { params });
//   }

//   crear(formData: FormData): Observable<{ message: string; usuario: IUsuario }> {
//     return this.http.post<{ message: string; usuario: IUsuario }>(this.API_URL, formData);
//   }

//   deshabilitar(id: string): Observable<{ message: string; usuario: IUsuario }> {
//     return this.http.delete<{ message: string; usuario: IUsuario }>(`${this.API_URL}/${id}`);
//   }

//   habilitar(id: string): Observable<{ message: string; usuario: IUsuario }> {
//     return this.http.post<{ message: string; usuario: IUsuario }>(`${this.API_URL}/${id}/habilitar`, {});
//   }
// }
