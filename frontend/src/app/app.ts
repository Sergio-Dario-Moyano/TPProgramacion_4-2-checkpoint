import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ModalComponent } from './shared/components/modal/modal.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModalComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  private router = inject(Router);

  private urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects)
    ),
    { initialValue: '' }
  );

  constructor() {
    // Si se suelta un archivo fuera de una zona de carga, el navegador lo abriría y se perdería
    // lo que se estaba escribiendo: se cancela ese comportamiento en toda la app.
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => e.preventDefault());
  }

  /** La barra de navegación no se muestra en la pantalla de carga. */
  mostrarNavbar = computed(
    () => this.authService.isAuthenticated() && !this.urlActual().startsWith('/cargando')
  );
}

