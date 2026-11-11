import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { PublicacionesRepository } from './publicaciones.repository.js';
import { RangoFechasDto } from './dto/rango-fechas.dto.js';

/**
 * Estadísticas controller (Sprint 4).
 * Qué hace: Expone por GET los datos de los gráficos del dashboard.
 * Cómo lo hace: Solo administradores (JwtGuard → 401, AdminGuard → 403). Cada ruta recibe
 * ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD; si no llegan, toma los últimos 30 días.
 */
@Controller('estadisticas')
@UseGuards(JwtGuard, AdminGuard)
export class EstadisticasController {
  constructor(private readonly publicacionesRepository: PublicacionesRepository) {}

  /**
   * Convierte el rango recibido en fechas reales (hora de Argentina, día completo).
   * Devuelve 400 si "desde" es posterior a "hasta".
   */
  private resolverRango(query: RangoFechasDto) {
    const hoy = new Date();
    const hace30 = new Date(hoy.getTime() - 29 * 24 * 60 * 60 * 1000);
    const formato = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(d);

    const desdeTexto = (query.desde ?? formato(hace30)).slice(0, 10);
    const hastaTexto = (query.hasta ?? formato(hoy)).slice(0, 10);

    const desde = new Date(`${desdeTexto}T00:00:00.000-03:00`);
    const hasta = new Date(`${hastaTexto}T23:59:59.999-03:00`);

    if (desde > hasta) {
      throw new BadRequestException('La fecha "desde" no puede ser posterior a "hasta"');
    }
    return { desde, hasta, desdeTexto, hastaTexto };
  }

  /** GET /estadisticas/publicaciones-por-usuario → cantidad de publicaciones de cada usuario. */
  @Get('publicaciones-por-usuario')
  @HttpCode(HttpStatus.OK)
  async publicacionesPorUsuario(@Query() query: RangoFechasDto) {
    const { desde, hasta, desdeTexto, hastaTexto } = this.resolverRango(query);
    const datos = await this.publicacionesRepository.publicacionesPorUsuario(desde, hasta);
    const total = datos.reduce((acc: number, d: any) => acc + d.cantidad, 0);
    return { desde: desdeTexto, hasta: hastaTexto, total, datos };
  }

  /** GET /estadisticas/comentarios-por-dia → comentarios realizados en el lapso, por día. */
  @Get('comentarios-por-dia')
  @HttpCode(HttpStatus.OK)
  async comentariosPorDia(@Query() query: RangoFechasDto) {
    const { desde, hasta, desdeTexto, hastaTexto } = this.resolverRango(query);
    const datos = await this.publicacionesRepository.comentariosPorDia(desde, hasta);
    const total = datos.reduce((acc: number, d: any) => acc + d.cantidad, 0);
    return { desde: desdeTexto, hasta: hastaTexto, total, datos };
  }

  /** GET /estadisticas/comentarios-por-publicacion → comentarios de cada publicación (top 10). */
  @Get('comentarios-por-publicacion')
  @HttpCode(HttpStatus.OK)
  async comentariosPorPublicacion(@Query() query: RangoFechasDto) {
    const { desde, hasta, desdeTexto, hastaTexto } = this.resolverRango(query);
    const datos = await this.publicacionesRepository.comentariosPorPublicacion(desde, hasta);
    const total = datos.reduce((acc: number, d: any) => acc + d.cantidad, 0);
    return { desde: desdeTexto, hasta: hastaTexto, total, datos };
  }
}

















// // Importamos decoradores para controladores HTTP de NestJS
// import { Controller, Get, Query, UseGuards, Inject, forwardRef } from '@nestjs/common';
// import { ApiTags, ApiOperation } from '@nestjs/swagger';
// // Importamos los Guards de seguridad (requiere sesión válida y rol de administrador)
// import { JwtGuard } from '../auth/guards/jwt.guard.js';
// import { AdminGuard } from '../auth/guards/admin.guard.js';
// // Importamos el servicio de publicaciones
// import { PublicacionesService } from './publicaciones.service.js';
// // Importamos el servicio de comentarios mediante forwardRef para evitar ciclo de dependencias
// import { ComentariosService } from '../comentarios/comentarios.service.js';

// /**
//  * Controlador que expone las rutas para los gráficos interactivos del Dashboard de Estadísticas.
//  */
// @ApiTags('estadisticas')
// @Controller('estadisticas')
// @UseGuards(JwtGuard, AdminGuard) // Endpoints exclusivos para usuarios administradores
// export class EstadisticasController {
//   constructor(
//     private readonly publicacionesService: PublicacionesService,
//     @Inject(forwardRef(() => ComentariosService))
//     private readonly comentariosService: ComentariosService,
//   ) {}

//   /**
//    * Gráfico 1: Publicaciones realizadas por cada usuario en un lapso de días.
//    */
//   @Get('usuarios')
//   @ApiOperation({ summary: 'Cantidad de publicaciones por usuario (Admin)' })
//   async obtenerEstadisticasUsuarios(@Query('dias') dias?: string) {
//     const diasNum = dias ? parseInt(dias, 10) : undefined;
//     const data = await this.publicacionesService.obtenerEstadisticasUsuarios(diasNum);
//     return { data };
//   }

//   /**
//    * Gráfico 2: Evolución de comentarios en el tiempo.
//    */
//   @Get('timeline')
//   @ApiOperation({ summary: 'Cantidad de comentarios en el tiempo (Admin)' })
//   async obtenerEstadisticasTimeline(@Query('dias') dias?: string) {
//     const diasNum = dias ? parseInt(dias, 10) : undefined;
//     const data = await this.comentariosService.obtenerEstadisticasTimeline(diasNum);
//     return { data };
//   }

//   /**
//    * Gráfico 3: Distribución de comentarios por publicación (gráfico de dona).
//    */
//   @Get('por-publicacion')
//   @ApiOperation({ summary: 'Cantidad de comentarios por publicación (Admin)' })
//   async obtenerEstadisticasPorPublicacion(@Query('dias') dias?: string) {
//     const diasNum = dias ? parseInt(dias, 10) : undefined;
//     const data = await this.comentariosService.obtenerEstadisticasPorPublicacion(diasNum);
//     return { data };
//   }
// }