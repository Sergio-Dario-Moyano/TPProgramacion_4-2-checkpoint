// Inyección de dependencias de Angular
import { Injectable, inject } from '@angular/core';
// Cliente HTTP y clase HttpParams para construcción limpia de parámetros en URL
import { HttpClient, HttpParams } from '@angular/common/http';
// Observable para manejo asíncrono
import { Observable } from 'rxjs';
// Variables de entorno para obtener la URL base
import { environment } from '../../../environments/environment';
// Interfaces tipadas para la publicación y su respuesta paginada
import { IPublicacion, IRespuestaPublicaciones } from '../models/publicacion.interface';

/**
 * Servicio encargado del ciclo de vida de las publicaciones:
 * creación, listado paginado con orden dinámico, baja lógica y gestión de Me Gusta.
 */
@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  // Inyectamos el cliente HttpClient
  private http = inject(HttpClient);
  // Construimos la ruta base del endpoint de publicaciones
  private readonly API_URL = `${environment.apiUrl || 'http://localhost:3000'}/publicaciones`;

  /**
   * Crea una nueva publicación enviando datos en formato multipart/form-data.
   * Permite enviar título, descripción y archivo de imagen opcional para Cloudinary.
   */
  crear(formData: FormData): Observable<{ message: string; publicacion: IPublicacion }> {
    return this.http.post<{ message: string; publicacion: IPublicacion }>(this.API_URL, formData);
  }

  /**
   * Obtiene la lista de publicaciones activas con soporte para:
   * - Paginación incremental mediante offset y limit
   * - Ordenamiento dinámico: por 'fecha' o por 'meGustas'
   * - Filtro opcional por el identificador de un usuario específico
   */
  listar(
    offset: number = 0,
    limit: number = 10,
    orden: 'fecha' | 'meGustas' = 'fecha',
    usuarioId?: string
  ): Observable<IRespuestaPublicaciones> {
    // Inicializamos los parámetros de consulta
    let params = new HttpParams()
      .set('offset', offset.toString())
      .set('limit', limit.toString())
      .set('orden', orden);

    // Si se especifica un ID de usuario (por ejemplo, en Mi Perfil), se agrega al query
    if (usuarioId) {
      params = params.set('usuarioId', usuarioId);
    }

    // Ejecutamos la petición GET con los parámetros construidos
    return this.http.get<IRespuestaPublicaciones>(this.API_URL, { params });
  }

  /**
   * Realiza la baja lógica de una publicación por su ID.
   * Permitido al creador original o a usuarios con perfil de administrador.
   */
  eliminar(idPublicacion: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${idPublicacion}`);
  }

  /**
   * Registra un Me Gusta del usuario autenticado sobre la publicación indicada.
   */
  darMeGusta(idPublicacion: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${idPublicacion}/like`, {});
  }

  /**
   * Elimina el Me Gusta previamente otorgado por el usuario sobre la publicación.
   */
  quitarMeGusta(idPublicacion: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${idPublicacion}/like`);
  }

  /**
   * Obtiene una publicación específica por su ID junto a sus datos poblados.
   */
  getById(id: string): Observable<IPublicacion> {
    return this.http.get<IPublicacion>(`${this.API_URL}/${id}`);
  }
}
