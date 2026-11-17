import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { SKIP_INTERCEPTOR } from '../interceptors/http-context-tokens';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoriaPublicacion,
  IPublicacion,
  IRespuestaPublicaciones
} from '../models/publicacion.interface';

interface IRespuestaPublicacion {
  message: string;
  publicacion: IPublicacion;
}

/**
 * Contexto de un pedido "silencioso": el interceptor no muestra el aviso de 401/403.
 * Lo usa la actualización en vivo (sondeo), que no es una acción del usuario.
 */
export function contextoSilencioso(silencioso: boolean): HttpContext {
  return new HttpContext().set(SKIP_INTERCEPTOR, silencioso);
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/publicaciones`;

  crear(formData: FormData): Observable<IRespuestaPublicacion> {
    return this.http.post<IRespuestaPublicacion>(this.API_URL, formData);
  }

  /** Edita una publicación propia (multipart: título, descripción, categoría, juego, file, quitarImagen). */
  actualizar(id: string, formData: FormData): Observable<IRespuestaPublicacion> {
    return this.http.put<IRespuestaPublicacion>(`${this.API_URL}/${id}`, formData);
  }

  listar(
    offset = 0,
    limit = 5,
    orden: 'fecha' | 'meGustas' = 'fecha',
    usuarioId?: string,
    categoria?: CategoriaPublicacion | null,
    silencioso = false
  ): Observable<IRespuestaPublicaciones> {
    let params = new HttpParams()
      .set('offset', offset)
      .set('limit', limit)
      .set('orden', orden);

    if (usuarioId) params = params.set('usuarioId', usuarioId);
    if (categoria) params = params.set('categoria', categoria);

    return this.http.get<IRespuestaPublicaciones>(this.API_URL, { params, context: contextoSilencioso(silencioso) });
  }

  /**
   * `silencioso = true` lo usa la actualización en vivo: si falla (por ejemplo un 401 con el token
   * vencido) no dispara el aviso global; ese aviso queda para las acciones del usuario.
   */
  getById(id: string, silencioso = false): Observable<IPublicacion> {
    return this.http
      .get<{ publicacion: IPublicacion }>(`${this.API_URL}/${id}`, { context: contextoSilencioso(silencioso) })
      .pipe(map((response) => response.publicacion));
  }

  eliminar(id: string): Observable<IRespuestaPublicacion> {
    return this.http.delete<IRespuestaPublicacion>(`${this.API_URL}/${id}`);
  }

  darMeGusta(id: string): Observable<IRespuestaPublicacion> {
    return this.http.post<IRespuestaPublicacion>(`${this.API_URL}/${id}/like`, {});
  }

  quitarMeGusta(id: string): Observable<IRespuestaPublicacion> {
    return this.http.delete<IRespuestaPublicacion>(`${this.API_URL}/${id}/like`);
  }
}




















