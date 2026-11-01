// Inyección de dependencias
import { Injectable, inject } from '@angular/core';
// Cliente HTTP
import { HttpClient } from '@angular/common/http';
// Entorno base
import { environment } from '../../../environments/environment';
// Flujo Observable
import { Observable } from 'rxjs';

/**
 * Servicio encargado de proveer métricas procesadas por agregaciones de MongoDB
 * para alimentar los gráficos de Chart.js en el Dashboard de Estadísticas.
 */
@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  // Inyección de HttpClient
  private http = inject(HttpClient);
  // URL base del módulo de estadísticas
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/estadisticas`;

  /**
   * Obtiene la distribución de publicaciones realizadas por cada usuario en el lapso elegido.
   */
  getUsuariosStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
    return this.http.get<{ data: Array<{ label: string; data: number }> }>(
      `${this.API_URL}/usuarios?dias=${dias}`
    );
  }

  /**
   * Obtiene la evolución temporal de comentarios generados por día.
   */
  getTimelineStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
    return this.http.get<{ data: Array<{ label: string; data: number }> }>(
      `${this.API_URL}/timeline?dias=${dias}`
    );
  }

  /**
   * Obtiene el top de publicaciones con mayor cantidad de comentarios registrados.
   */
  getPublicacionesStats(dias: number): Observable<{ data: Array<{ label: string; data: number }> }> {
    return this.http.get<{ data: Array<{ label: string; data: number }> }>(
      `${this.API_URL}/por-publicacion?dias=${dias}`
    );
  }
}
