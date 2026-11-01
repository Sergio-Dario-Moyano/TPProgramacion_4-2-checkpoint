// Importamos utilidades de componentes, ciclo de vida e inyección de dependencias
import { Component, inject, OnInit } from '@angular/core';
// Importamos el enrutador para redirigir según el resultado de la validación
import { Router } from '@angular/router';
// Importamos el servicio de autenticación para comprobar la sesión con el backend
import { AuthService } from '../../core/services/auth.service';
// Importamos el servicio de temporizador para encender el contador de 10 minutos
import { ContadorService } from '../../core/services/contador.service';

/**
 * Componente standalone que actúa como splash de arranque y verificación perimetral.
 */
@Component({
  selector: 'app-pantalla-cargando',
  standalone: true,
  imports: [],
  templateUrl: './pantalla-cargando.html',
  styleUrl: './pantalla-cargando.css'
})
export class PantallaCargando implements OnInit {
  // Inyectamos el servicio de autenticación
  private auth = inject(AuthService);
  // Inyectamos el enrutador
  private router = inject(Router);
  // Inyectamos el servicio del contador
  private contadorService = inject(ContadorService);

  // Al montarse el componente en pantalla, ejecutamos la verificación
  ngOnInit(): void {
    this.verificarEstadoSesion();
  }

  /**
   * Consulta al endpoint silencioso de autorización.
   * Si la cookie HttpOnly es válida, recupera los datos del usuario.
   */
  private verificarEstadoSesion(): void {
    // Invocamos el método autorizarSesion con bypass de interceptor global
    this.auth.autorizarSesion().subscribe({
      next: (res: any) => {
        // Almacenamos el usuario validado en memoria reactiva y almacenamiento local
        this.auth.setUsuarioActual(res.usuario);
        // Iniciamos el temporizador de 10 minutos de inactividad de la sesión
        this.contadorService.iniciarTemporizador();
        // Redirigimos al usuario al feed principal de publicaciones
        this.router.navigate(['/publicaciones']);
      },
      error: () => {
        // Si el token expiró o la cookie no existe, limpiamos el Signal del usuario
        this.auth.actualUser.set(null);
        // Removemos cualquier rastro del usuario en el almacenamiento local
        localStorage.removeItem('usuarioActual');
        // Redirigimos al usuario al login para que ingrese sus credenciales
        this.router.navigate(['/login']);
      }
    });
  }
}
