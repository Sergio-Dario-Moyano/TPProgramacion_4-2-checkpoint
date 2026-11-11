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




















// // Inyección de dependencias
// import { Injectable, inject } from '@angular/core';
// // Cliente HTTP
// import { HttpClient } from '@angular/common/http';
// // Entorno base
// import { environment } from '../../../environments/environment';
// // Flujo Observable
// import { Observable } from 'rxjs';

// /**
//  * Servicio encargado de proveer métricas procesadas por agregaciones de MongoDB
//  * para alimentar los gráficos de Chart.js en el Dashboard de Estadísticas.
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class EstadisticasService {
//   // Inyección de HttpClient
//   private http = inject(HttpClient);
//   // URL base del módulo de estadísticas
//   private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/estadisticas`;

//   /**
//    * Obtiene la distribución de publicaciones realizadas por cada usuario en el lapso elegido.
//    */
//   getUsuariosStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
//     return this.http.get<{ data: Array<{ label: string; data: number }> }>(
//       `${this.API_URL}/usuarios?dias=${dias}`
//     );
//   }

//   /**
//    * Obtiene la evolución temporal de comentarios generados por día.
//    */
//   getTimelineStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
//     return this.http.get<{ data: Array<{ label: string; data: number }> }>(
//       `${this.API_URL}/timeline?dias=${dias}`
//     );
//   }

//   /**
//    * Obtiene el top de publicaciones con mayor cantidad de comentarios registrados.
//    */
//   getPublicacionesStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
//     return this.http.get<{ data: Array<{ label: string; data: number }> }>(
//       `${this.API_URL}/por-publicacion?dias=${dias}`
//     );
//   }
// }
