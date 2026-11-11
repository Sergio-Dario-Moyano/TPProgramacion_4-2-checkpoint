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


















// // Inyección de dependencias
// import { Injectable, inject } from '@angular/core';
// // Cliente HTTP y manejo de parámetros de URL
// import { HttpClient, HttpParams } from '@angular/common/http';
// // Entorno con la URL base del backend
// import { environment } from '../../../environments/environment';
// // Flujo asíncrono Observable
// import { Observable } from 'rxjs';
// // Modelo estructurado de comentarios
// import { IRespuestaComentarios } from '../models/comentario.interface';

// /**
//  * Servicio encargado de la gestión de comentarios en publicaciones:
//  * consulta paginada, creación, edición en línea y eliminación.
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class ComentariosService {
//   // Inyección de HttpClient
//   private http = inject(HttpClient);
//   // URL base para el módulo de comentarios
//   private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/comentarios`;

//   /**
//    * Lista los comentarios de una publicación de forma paginada y ordenada cronológicamente.
//    */
//   listar(publicacionId: string, limit: number = 5, offset: number = 0): Observable<IRespuestaComentarios> {
//     const params = new HttpParams()
//       .set('limit', limit.toString())
//       .set('offset', offset.toString());

//     return this.http.get<IRespuestaComentarios>(`${this.API_URL}/publicacion/${publicacionId}`, { params });
//   }

//   /**
//    * Crea un comentario asociado a una publicación específica.
//    * El backend incrementa automáticamente el contador cantidadComentarios del post.
//    */
//   crear(publicacionId: string, texto: string): Observable<any> {
//     return this.http.post(`${this.API_URL}/publicacion/${publicacionId}`, { texto });
//   }

//   /**
//    * Edita el texto de un comentario propio existente (hasta 150 caracteres).
//    * El backend marca el campo modificado en true.
//    */
//   actualizar(comentarioId: string, texto: string): Observable<any> {
//     return this.http.put(`${this.API_URL}/${comentarioId}`, { texto });
//   }

//   /**
//    * Elimina un comentario (baja lógica).
//    * El backend decrementa automáticamente el contador de comentarios en la publicación.
//    */
//   eliminar(comentarioId: string): Observable<any> {
//     return this.http.delete(`${this.API_URL}/${comentarioId}`);
//   }
// }
