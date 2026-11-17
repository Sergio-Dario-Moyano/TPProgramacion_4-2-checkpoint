import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IComentariosPorDia,
  IComentariosPorPublicacion,
  IPublicacionesPorUsuario,
  IRespuestaEstadistica
} from '../models/estadisticas.interface';

/** Consume las rutas GET del EstadisticasController (Sprint 4, solo administradores). */
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/estadisticas`;

  private params(desde: string, hasta: string): HttpParams {
    return new HttpParams().set('desde', desde).set('hasta', hasta);
  }

  publicacionesPorUsuario(desde: string, hasta: string): Observable<IRespuestaEstadistica<IPublicacionesPorUsuario>> {
    return this.http.get<IRespuestaEstadistica<IPublicacionesPorUsuario>>(
      `${this.API_URL}/publicaciones-por-usuario`,
      { params: this.params(desde, hasta) }
    );
  }

  comentariosPorDia(desde: string, hasta: string): Observable<IRespuestaEstadistica<IComentariosPorDia>> {
    return this.http.get<IRespuestaEstadistica<IComentariosPorDia>>(
      `${this.API_URL}/comentarios-por-dia`,
      { params: this.params(desde, hasta) }
    );
  }

  comentariosPorPublicacion(desde: string, hasta: string): Observable<IRespuestaEstadistica<IComentariosPorPublicacion>> {
    return this.http.get<IRespuestaEstadistica<IComentariosPorPublicacion>>(
      `${this.API_URL}/comentarios-por-publicacion`,
      { params: this.params(desde, hasta) }
    );
  }
}




















