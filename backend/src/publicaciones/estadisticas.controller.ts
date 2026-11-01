// Importamos decoradores para controladores HTTP de NestJS
import { Controller, Get, Query, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importamos los Guards de seguridad (requiere sesión válida y rol de administrador)
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
// Importamos el servicio de publicaciones
import { PublicacionesService } from './publicaciones.service.js';
// Importamos el servicio de comentarios mediante forwardRef para evitar ciclo de dependencias
import { ComentariosService } from '../comentarios/comentarios.service.js';

/**
 * Controlador que expone las rutas para los gráficos interactivos del Dashboard de Estadísticas.
 */
@ApiTags('estadisticas')
@Controller('estadisticas')
@UseGuards(JwtGuard, AdminGuard) // Endpoints exclusivos para usuarios administradores
export class EstadisticasController {
  constructor(
    private readonly publicacionesService: PublicacionesService,
    @Inject(forwardRef(() => ComentariosService))
    private readonly comentariosService: ComentariosService,
  ) {}

  /**
   * Gráfico 1: Publicaciones realizadas por cada usuario en un lapso de días.
   */
  @Get('usuarios')
  @ApiOperation({ summary: 'Cantidad de publicaciones por usuario (Admin)' })
  async obtenerEstadisticasUsuarios(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias, 10) : undefined;
    const data = await this.publicacionesService.obtenerEstadisticasUsuarios(diasNum);
    return { data };
  }

  /**
   * Gráfico 2: Evolución de comentarios en el tiempo.
   */
  @Get('timeline')
  @ApiOperation({ summary: 'Cantidad de comentarios en el tiempo (Admin)' })
  async obtenerEstadisticasTimeline(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias, 10) : undefined;
    const data = await this.comentariosService.obtenerEstadisticasTimeline(diasNum);
    return { data };
  }

  /**
   * Gráfico 3: Distribución de comentarios por publicación (gráfico de dona).
   */
  @Get('por-publicacion')
  @ApiOperation({ summary: 'Cantidad de comentarios por publicación (Admin)' })
  async obtenerEstadisticasPorPublicacion(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias, 10) : undefined;
    const data = await this.comentariosService.obtenerEstadisticasPorPublicacion(diasNum);
    return { data };
  }
}