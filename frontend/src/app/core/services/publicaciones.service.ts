import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    categoria?: CategoriaPublicacion | null
  ): Observable<IRespuestaPublicaciones> {
    let params = new HttpParams()
      .set('offset', offset)
      .set('limit', limit)
      .set('orden', orden);

    if (usuarioId) params = params.set('usuarioId', usuarioId);
    if (categoria) params = params.set('categoria', categoria);

    return this.http.get<IRespuestaPublicaciones>(this.API_URL, { params });
  }

  getById(id: string): Observable<IPublicacion> {
    return this.http
      .get<{ publicacion: IPublicacion }>(`${this.API_URL}/${id}`)
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




















