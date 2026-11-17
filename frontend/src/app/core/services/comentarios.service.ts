import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IRespuestaComentarios } from '../models/comentario.interface';

@Injectable({
  providedIn: 'root'
})
export class ComentariosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/comentarios`;

  /**
   * Obtiene los comentarios de una publicación específica con paginación.
   * Qué hace: Trae los comentarios ordenados con los más recientes primero.
   * Cómo lo hace: Realiza una petición GET a /comentarios/publicacion/:id enviando limit y offset.
   */
  listar(publicacionId: string, limit: number = 5, offset: number = 0): Observable<IRespuestaComentarios> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<IRespuestaComentarios>(`${this.API_URL}/publicacion/${publicacionId}`, { params });
  }

  /**
   * Agrega un nuevo comentario a una publicación.
   * Qué hace: Guarda el comentario e incrementa el contador de comentarios en la publicación.
   * Cómo lo hace: Realiza una petición POST enviando el texto del comentario.
   */
  crear(publicacionId: string, texto: string): Observable<any> {
    return this.http.post(`${this.API_URL}/publicacion/${publicacionId}`, { texto });
  }

  /**
   * Edita el mensaje de un comentario propio existente (Sprint 3).
   * Qué hace: Modifica el contenido textual y fija modificado: true.
   * Cómo lo hace: Realiza una petición PUT a /comentarios/:id con el nuevo texto.
   */
  actualizar(comentarioId: string, texto: string): Observable<any> {
    return this.http.put(`${this.API_URL}/${comentarioId}`, { texto });
  }

  /**
   * Da de baja lógica a un comentario.
   * Qué hace: Elimina el comentario y reduce el contador en la publicación.
   * Cómo lo hace: Realiza una petición DELETE a /comentarios/:id.
   */
  eliminar(comentarioId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${comentarioId}`);
  }
}


















