import { Component, input } from '@angular/core';

/**
 * Logo de Checkpoint (joystick propio). Reemplaza a los SVG sueltos que se repetían en cada pantalla.
 * Uso: <app-logo /> o <app-logo [conTexto]="false" tamano="40px" />
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [style.--tam]="tamano()">
      <svg viewBox="0 0 64 64" class="logo-svg" aria-hidden="true">
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a259ff" />
            <stop offset="1" stop-color="#00e5ff" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="14" fill="#0a0a12" />
        <rect x="1.5" y="1.5" width="61" height="61" rx="12.5" fill="none" stroke="url(#logoGrad)" stroke-width="3" />
        <path
          d="M20 21h24c6.5 0 10.5 4.5 11.6 11l1.9 11.2c.9 5.3-4.8 8.8-8.9 5.4L42.5 43H21.5l-6.1 5.6c-4.1 3.4-9.8-.1-8.9-5.4L8.4 32C9.5 25.5 13.5 21 20 21z"
          fill="#151524" stroke="url(#logoGrad)" stroke-width="3" stroke-linejoin="round" />
        <path d="M20 28v10M15 33h10" stroke="#f2f0ff" stroke-width="3.2" stroke-linecap="round" />
        <circle cx="43" cy="29.5" r="2.8" fill="#00e5ff" />
        <circle cx="48.5" cy="35" r="2.8" fill="#b6ff3b" />
        <circle cx="37.5" cy="35" r="2.8" fill="#a259ff" />
      </svg>
      @if (conTexto()) {
        <span class="logo-texto">CHECK<span class="logo-acento">POINT</span></span>
      }
    </span>
  `,
  styles: `
    .logo { display: inline-flex; align-items: center; gap: 0.6rem; }
    .logo-svg { width: var(--tam, 34px); height: var(--tam, 34px); filter: drop-shadow(0 0 10px rgba(162, 89, 255, 0.35)); flex-shrink: 0; }
    .logo-texto { font-family: var(--font-display); font-weight: 700; font-size: 1.35rem; letter-spacing: 0.08em; color: var(--text-main); }
    .logo-acento { color: var(--color-primary); }
    @media (max-width: 420px) { .logo-texto { font-size: 1.05rem; letter-spacing: 0.04em; } .logo { gap: 0.4rem; } }
  `
})
export class LogoComponent {
  conTexto = input<boolean>(true);
  tamano = input<string>('34px');
}
