import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import Chart from 'chart.js/auto';
import type { ChartConfiguration, ChartType } from 'chart.js';

/**
 * Paleta categórica de los gráficos, validada para fondo oscuro
 * (banda de luminosidad, separación para daltonismo y contraste ≥ 3:1).
 * Los colores se asignan siempre en este orden; nunca se generan colores nuevos.
 */
export const PALETA_GRAFICOS = ['#9085e9', '#d95926', '#199e70', '#c98500', '#d55181', '#3987e5'];
export const COLOR_OTROS = '#6c6a8e';

/**
 * Envoltorio de Chart.js (Sprint 4).
 * Recibe tipo, etiquetas y series; se vuelve a dibujar cuando cambian los datos.
 */
@Component({
  selector: 'app-grafico',
  standalone: true,
  template: `<div class="grafico-wrap" [style.height]="alto()"><canvas #lienzo [attr.aria-label]="descripcion()" role="img"></canvas></div>`,
  styles: `.grafico-wrap { position: relative; width: 100%; }`
})
export class GraficoComponent implements AfterViewInit, OnDestroy {
  tipo = input.required<ChartType>();
  etiquetas = input<string[]>([]);
  series = input<ChartConfiguration['data']['datasets']>([]);
  opciones = input<ChartConfiguration['options']>({});
  alto = input<string>('300px');
  descripcion = input<string>('Gráfico');

  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private grafico: Chart | null = null;
  private listo = false;

  constructor() {
    effect(() => {
      // Lee las entradas para que el efecto se dispare cuando cambian
      const datos = { labels: this.etiquetas(), datasets: this.series() };
      const tipo = this.tipo();
      const opciones = this.opciones();
      if (this.listo) this.dibujar(tipo, datos, opciones);
    });
  }

  ngAfterViewInit(): void {
    this.listo = true;
    this.dibujar(this.tipo(), { labels: this.etiquetas(), datasets: this.series() }, this.opciones());
  }

  private dibujar(tipo: ChartType, datos: ChartConfiguration['data'], opciones: ChartConfiguration['options']): void {
    this.grafico?.destroy();

    Chart.defaults.color = '#a6a3c4';
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

    this.grafico = new Chart(this.lienzo().nativeElement, {
      type: tipo,
      data: datos,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        ...opciones,
        plugins: {
          ...opciones?.plugins,
          tooltip: {
            backgroundColor: '#1c1c30',
            borderColor: '#3b3b60',
            borderWidth: 1,
            titleColor: '#f2f0ff',
            bodyColor: '#f2f0ff',
            padding: 10,
            ...opciones?.plugins?.tooltip
          }
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.grafico?.destroy();
  }
}
