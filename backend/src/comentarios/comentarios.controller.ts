// Importamos decoradores para controladores HTTP de NestJS
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importamos el Guard de seguridad JWT
import { JwtGuard } from '../auth/guards/jwt.guard.js';
// Importamos el servicio de comentarios
import { ComentariosService } from './comentarios.service.js';
// Importamos los DTOs
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';

/**
 * Controlador de comentarios: alta, consulta paginada, edición en línea y baja lógica.
 */
@ApiTags('comentarios')
@Controller('comentarios')
@UseGuards(JwtGuard) // Requiere sesión activa en cookies HttpOnly
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  /**
   * Publicar un comentario en un post específico.
   */
  @Post('publicacion/:publicacionId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar un comentario a una publicación' })
  async crear(
    @Param('publicacionId') publicacionId: string,
    @Body() createDto: CreateComentarioDto,
    @Req() request: any,
  ) {
    const usuarioId = request.user.id;
    return this.comentariosService.crear(publicacionId, usuarioId, createDto);
  }

  /**
   * Listar comentarios paginados de una publicación.
   */
  @Get('publicacion/:publicacionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar comentarios de una publicación con paginación' })
  async listarPorPublicacion(
    @Param('publicacionId') publicacionId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    const offsetNum = offset ? parseInt(offset, 10) : 0;
    return this.comentariosService.listarPorPublicacion(publicacionId, limitNum, offsetNum);
  }

  /**
   * Editar un comentario propio (máximo 150 caracteres).
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar un comentario propio (en línea)' })
  async actualizar(
    @Param('id') id: string,
    @Body() updateDto: UpdateComentarioDto,
    @Req() request: any,
  ) {
    const usuarioId = request.user.id;
    return this.comentariosService.actualizar(id, usuarioId, updateDto);
  }

  /**
   * Dar de baja lógica un comentario (autor o administrador).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja un comentario (Baja lógica)' })
  async eliminar(@Param('id') id: string, @Req() request: any) {
    const usuarioId = request.user.id;
    return this.comentariosService.eliminar(id, usuarioId);
  }
}