import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { ChartConfiguration } from 'chart.js';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import {
  IComentariosPorDia,
  IComentariosPorPublicacion,
  IPublicacionesPorUsuario
} from '../../../core/models/estadisticas.interface';
import { COLOR_OTROS, GraficoComponent, PALETA_GRAFICOS } from '../../../shared/components/grafico/grafico.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

/** Rango de fechas de un gráfico (formato YYYY-MM-DD). */
interface Rango {
  desde: string;
  hasta: string;
}

const fechaISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Rango de los últimos `dias` días, incluyendo hoy. */
function ultimosDias(dias: number): Rango {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(hasta.getDate() - (dias - 1));
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
}

const MAX_PORCIONES = 5;

/**
 * Dashboard / Estadísticas (Sprint 4, solo administradores).
 * Tres gráficos de tipos distintos, cada uno con su propio lapso de tiempo:
 *  1. Barras: publicaciones realizadas por cada usuario.
 *  2. Líneas: comentarios realizados por día.
 *  3. Torta (dona): comentarios en cada publicación.
 */
@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [DatePipe, NgTemplateOutlet, FormsModule, RouterLink, RouterLinkActive, GraficoComponent, SpinnerComponent],
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.css'
})
export class DashboardEstadisticas implements OnInit {
  private estadisticas = inject(EstadisticasService);

  readonly presets = [
    { dias: 7, texto: '7 días' },
    { dias: 30, texto: '30 días' },
    { dias: 90, texto: '90 días' },
    { dias: 365, texto: '1 año' }
  ];
  readonly paleta = PALETA_GRAFICOS;
  readonly colorOtros = COLOR_OTROS;
  readonly hoy = fechaISO(new Date());

  // ---- 1. Publicaciones por usuario (barras) ----
  rangoPub = signal<Rango>(ultimosDias(30));
  datosPub = signal<IPublicacionesPorUsuario[]>([]);
  totalPub = signal(0);
  cargandoPub = signal(false);
  errorPub = signal<string | null>(null);

  // ---- 2. Comentarios por día (líneas) ----
  rangoCom = signal<Rango>(ultimosDias(30));
  datosCom = signal<IComentariosPorDia[]>([]);
  totalCom = signal(0);
  cargandoCom = signal(false);
  errorCom = signal<string | null>(null);

  // ---- 3. Comentarios por publicación (torta) ----
  rangoPost = signal<Rango>(ultimosDias(30));
  datosPost = signal<IComentariosPorPublicacion[]>([]);
  totalPost = signal(0);
  cargandoPost = signal(false);
  errorPost = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarPublicaciones();
    this.cargarComentarios();
    this.cargarPorPublicacion();
  }

  rangoValido(r: Rango): boolean {
    return !!r.desde && !!r.hasta && r.desde <= r.hasta;
  }

  presetActivo(r: Rango, dias: number): boolean {
    const p = ultimosDias(dias);
    return p.desde === r.desde && p.hasta === r.hasta;
  }

  aplicarPreset(cual: 'pub' | 'com' | 'post', dias: number): void {
    this.actualizarRango(cual, ultimosDias(dias));
  }

  actualizarRango(cual: 'pub' | 'com' | 'post', rango: Rango): void {
    if (cual === 'pub') { this.rangoPub.set(rango); this.cargarPublicaciones(); }
    if (cual === 'com') { this.rangoCom.set(rango); this.cargarComentarios(); }
    if (cual === 'post') { this.rangoPost.set(rango); this.cargarPorPublicacion(); }
  }

  private mensajeError(err: any): string {
    return err?.error?.message ?? 'No se pudieron cargar los datos.';
  }

  // =====================================================================
  // 1. Barras
  // =====================================================================
  cargarPublicaciones(): void {
    const r = this.rangoPub();
    if (!this.rangoValido(r)) { this.errorPub.set('La fecha "desde" no puede ser posterior a "hasta".'); return; }
    this.cargandoPub.set(true);
    this.errorPub.set(null);
    this.estadisticas.publicacionesPorUsuario(r.desde, r.hasta).subscribe({
      next: (res) => { this.datosPub.set(res.datos); this.totalPub.set(res.total); this.cargandoPub.set(false); },
      error: (err) => { this.errorPub.set(this.mensajeError(err)); this.cargandoPub.set(false); }
    });
  }

  etiquetasPub = computed(() => this.datosPub().map((d) => '@' + d.nombreUsuario));
  seriesPub = computed<ChartConfiguration<'bar'>['data']['datasets']>(() => [{
    label: 'Publicaciones',
    data: this.datosPub().map((d) => d.cantidad),
    backgroundColor: PALETA_GRAFICOS[0],
    borderRadius: { topLeft: 4, topRight: 4 },
    borderSkipped: 'bottom',
    maxBarThickness: 36
  }]);
  readonly opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Publicaciones' } }
    }
  };

  // =====================================================================
  // 2. Líneas (se completan con 0 los días sin comentarios)
  // =====================================================================
  cargarComentarios(): void {
    const r = this.rangoCom();
    if (!this.rangoValido(r)) { this.errorCom.set('La fecha "desde" no puede ser posterior a "hasta".'); return; }
    this.cargandoCom.set(true);
    this.errorCom.set(null);
    this.estadisticas.comentariosPorDia(r.desde, r.hasta).subscribe({
      next: (res) => { this.datosCom.set(this.completarDias(res.datos, r)); this.totalCom.set(res.total); this.cargandoCom.set(false); },
      error: (err) => { this.errorCom.set(this.mensajeError(err)); this.cargandoCom.set(false); }
    });
  }

  private completarDias(datos: IComentariosPorDia[], r: Rango): IComentariosPorDia[] {
    const mapa = new Map(datos.map((d) => [d.fecha, d.cantidad]));
    const resultado: IComentariosPorDia[] = [];
    const actual = new Date(`${r.desde}T12:00:00`);
    const fin = new Date(`${r.hasta}T12:00:00`);
    while (actual <= fin && resultado.length < 400) {
      const clave = fechaISO(actual);
      resultado.push({ fecha: clave, cantidad: mapa.get(clave) ?? 0 });
      actual.setDate(actual.getDate() + 1);
    }
    return resultado;
  }

  etiquetasCom = computed(() => this.datosCom().map((d) => d.fecha.slice(8, 10) + '/' + d.fecha.slice(5, 7)));
  seriesCom = computed<ChartConfiguration<'line'>['data']['datasets']>(() => [{
    label: 'Comentarios',
    data: this.datosCom().map((d) => d.cantidad),
    borderColor: PALETA_GRAFICOS[1],
    backgroundColor: 'rgba(217, 89, 38, 0.12)',
    borderWidth: 2,
    fill: true,
    cubicInterpolationMode: 'monotone', // la curva no baja de 0 entre puntos
    pointRadius: this.datosCom().length > 45 ? 0 : 3,
    pointHoverRadius: 5
  }]);
  readonly opcionesLineas: ChartConfiguration<'line'>['options'] = {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Comentarios' } }
    }
  };
  diaPico = computed(() => this.datosCom().reduce<IComentariosPorDia | null>((max, d) => (!max || d.cantidad > max.cantidad ? d : max), null));

  // =====================================================================
  // 3. Torta (las 5 publicaciones con más comentarios + "Otras")
  // =====================================================================
  cargarPorPublicacion(): void {
    const r = this.rangoPost();
    if (!this.rangoValido(r)) { this.errorPost.set('La fecha "desde" no puede ser posterior a "hasta".'); return; }
    this.cargandoPost.set(true);
    this.errorPost.set(null);
    this.estadisticas.comentariosPorPublicacion(r.desde, r.hasta).subscribe({
      next: (res) => { this.datosPost.set(res.datos); this.totalPost.set(res.total); this.cargandoPost.set(false); },
      error: (err) => { this.errorPost.set(this.mensajeError(err)); this.cargandoPost.set(false); }
    });
  }

  porciones = computed(() => {
    const datos = this.datosPost();
    const top = datos.slice(0, MAX_PORCIONES).map((d, i) => ({
      etiqueta: d.titulo.length > 32 ? d.titulo.slice(0, 31) + '…' : d.titulo,
      cantidad: d.cantidad,
      color: PALETA_GRAFICOS[i],
      activa: d.activa,
      id: d.publicacionId as string | null
    }));
    const resto = datos.slice(MAX_PORCIONES).reduce((acc, d) => acc + d.cantidad, 0);
    if (resto > 0) top.push({ etiqueta: 'Otras publicaciones', cantidad: resto, color: COLOR_OTROS, activa: true, id: null });
    return top;
  });
  etiquetasPost = computed(() => this.porciones().map((p) => p.etiqueta));
  seriesPost = computed<ChartConfiguration<'doughnut'>['data']['datasets']>(() => [{
    label: 'Comentarios',
    data: this.porciones().map((p) => p.cantidad),
    backgroundColor: this.porciones().map((p) => p.color),
    borderColor: '#151524',
    borderWidth: 2,
    hoverOffset: 6
  }]);
  readonly opcionesTorta: ChartConfiguration<'doughnut'>['options'] = {
    cutout: '58%',
    interaction: { mode: 'nearest', intersect: true },
    plugins: { legend: { display: false } }
  };

  porcentaje(cantidad: number): string {
    const total = this.porciones().reduce((a, p) => a + p.cantidad, 0);
    return total ? `${Math.round((cantidad / total) * 100)}%` : '0%';
  }
}
