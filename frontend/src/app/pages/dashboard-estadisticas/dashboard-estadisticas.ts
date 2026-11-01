// Importamos utilidades de componentes, señales reactivas e inyección de dependencias de Angular
import { Component, inject, OnInit, signal, computed } from '@angular/core';
// Importamos RouterLink y RouterLinkActive para las pestañas superiores de navegación
import { RouterLink, RouterLinkActive } from '@angular/router';
// Importamos el componente BaseChartDirective de la librería ng2-charts
import { BaseChartDirective } from 'ng2-charts';
// Importamos configuraciones y tipos de Chart.js
import { ChartConfiguration, ChartData, ChartType, ChartOptions } from 'chart.js';
// Importamos el servicio de estadísticas conectado a las agregaciones del backend
import { EstadisticasService } from '../../core/services/estadisticas.service';
// Importamos el servicio de usuarios para contabilizar el total de cuentas registradas
import { UsuariosService } from '../../core/services/usuarios.service';
// Importamos el spinner de carga
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';

/**
 * Componente standalone que renderiza el panel analítico de estadísticas con Chart.js.
 */
@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, BaseChartDirective, SpinnerComponent],
  templateUrl: './dashboard-estadisticas.html',
  styleUrl: './dashboard-estadisticas.css'
})
export class DashboardEstadisticas implements OnInit {
  // Inyectamos el servicio de estadísticas
  private statsService = inject(EstadisticasService);
  // Inyectamos el servicio de usuarios
  private usuariosService = inject(UsuariosService);

  // Signal booleana que controla el estado de carga mientras se consultan las métricas
  loading = signal<boolean>(true);

  // Período de días seleccionado (7 por defecto, 30 para último mes)
  diasSeleccionados = signal<number>(7);

  // Signals para los contadores KPI principales
  kpiPublicaciones = signal<number>(0);
  kpiComentarios = signal<number>(0);
  kpiUsuarios = signal<number>(0);

  // Signal con el desglose porcentual de la dona
  distribucionDona = signal<Array<{ label: string; cantidad: number; porcentaje: number; color: string }>>([]);

  // ==========================================
  // CONFIGURACIÓN GRÁFICO 1: BARRAS HORIZONTALES (Publicaciones por Usuario)
  // ==========================================
  barChartType: 'bar' = 'bar';
  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Publicaciones',
        backgroundColor: '#00e5ff',
        borderRadius: 6,
        barThickness: 16
      }
    ]
  };

  barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y', // Configura la orientación horizontal de las barras
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        labels: {
          color: '#9aa5b8',
          boxWidth: 10,
          boxHeight: 10
        }
      },
      tooltip: {
        backgroundColor: '#151922',
        titleColor: '#f0f3f8',
        bodyColor: '#00e5ff',
        borderColor: '#242b3b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#606d84', precision: 0 }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#9aa5b8', font: { family: "'JetBrains Mono', monospace", size: 11 } }
      }
    }
  };

  // ==========================================
  // CONFIGURACIÓN GRÁFICO 2: LÍNEA TEMPORAL (Comentarios en el tiempo)
  // ==========================================
  lineChartType: 'line' = 'line';
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Comentarios por día',
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0, 229, 255, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: '#0b0d10',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        labels: {
          color: '#9aa5b8',
          boxWidth: 10,
          boxHeight: 10
        }
      },
      tooltip: {
        backgroundColor: '#151922',
        titleColor: '#f0f3f8',
        bodyColor: '#00e5ff',
        borderColor: '#242b3b',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#606d84', font: { family: "'JetBrains Mono', monospace", size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#606d84', precision: 0 }
      }
    }
  };

  // ==========================================
  // CONFIGURACIÓN GRÁFICO 3: DONA (Comentarios por Publicación)
  // ==========================================
  doughnutChartType: 'doughnut' = 'doughnut';
  doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#00e5ff', '#ff0d46', '#38bdf8', '#64748b', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%', // Espacio interior para ubicar el número central
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#151922',
        titleColor: '#f0f3f8',
        bodyColor: '#00e5ff',
        borderColor: '#242b3b',
        borderWidth: 1
      }
    }
  };

  ngOnInit(): void {
    // Al montar la pantalla cargamos las métricas con el rango por defecto
    this.cargarEstadisticas();
  }

  /**
   * Cambia el período de tiempo y actualiza los gráficos
   */
  cambiarPeriodo(dias: number): void {
    if (this.diasSeleccionados() === dias) return;
    this.diasSeleccionados.set(dias);
    this.cargarEstadisticas();
  }

  /**
   * Consulta concurrentemente todas las métricas al backend NestJS
   */
  cargarEstadisticas(): void {
    this.loading.set(true);
    const dias = this.diasSeleccionados();

    // 1. Cantidad total de usuarios registrados
    this.usuariosService.listarTodos().subscribe({
      next: (res) => {
        this.kpiUsuarios.set(res.usuarios?.length || 0);
      }
    });

    // 2. Publicaciones por cada usuario (Gráfico de Barras)
    this.statsService.getUsuariosStats(dias).subscribe({
      next: (res) => {
        const datos = res.data || [];
        const labels = datos.map((d) => d.label);
        const values = datos.map((d) => d.data);

        this.barChartData = {
          labels,
          datasets: [{ ...this.barChartData.datasets[0], data: values }]
        };

        // Calculamos la suma total para el KPI de publicaciones
        const totalPubs = values.reduce((acc, curr) => acc + curr, 0);
        this.kpiPublicaciones.set(totalPubs);
      }
    });

    // 3. Comentarios en el tiempo (Gráfico de Líneas)
    this.statsService.getTimelineStats(dias).subscribe({
      next: (res) => {
        const datos = res.data || [];
        const labels = datos.map((d) => d.label);
        const values = datos.map((d) => d.data);

        this.lineChartData = {
          labels,
          datasets: [{ ...this.lineChartData.datasets[0], data: values }]
        };
      }
    });

    // 4. Comentarios por publicación (Gráfico de Dona)
    this.statsService.getPublicacionesStats(dias).subscribe({
      next: (res) => {
        const datos = res.data || [];
        const labels = datos.map((d) => d.label);
        const values = datos.map((d) => d.data);
        const paleta = ['#00e5ff', '#ff0d46', '#38bdf8', '#64748b', '#94a3b8'];

        this.doughnutChartData = {
          labels,
          datasets: [{ ...this.doughnutChartData.datasets[0], data: values, backgroundColor: paleta }]
        };

        const totalComents = values.reduce((acc, curr) => acc + curr, 0);
        this.kpiComentarios.set(totalComents);

        // Armamos el arreglo detallado con etiquetas, cantidades y porcentajes calculados
        const items = datos.map((item, index) => {
          const pct = totalComents > 0 ? Math.round((item.data / totalComents) * 100) : 0;
          return {
            label: item.label,
            cantidad: item.data,
            porcentaje: pct,
            color: paleta[index % paleta.length]
          };
        });

        this.distribucionDona.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
