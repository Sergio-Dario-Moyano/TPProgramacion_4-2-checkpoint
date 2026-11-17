
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
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { ComentariosService } from './comentarios.service.js';
import { CreateComentarioDto } from './dto/create-comentario.dto.js';
import { UpdateComentarioDto } from './dto/update-comentario.dto.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';

@Controller('comentarios')
@UseGuards(JwtGuard)
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  /**
   * POST /comentarios/publicacion/:publicacionId (Sprint 3).
   * Qué hace: Agrega un nuevo comentario a la publicación junto con el usuario autenticado y la fecha.
   * Cómo lo hace: Toma el usuarioId desde request.user.id e invoca comentariosService.crear().
   */
  @Post('publicacion/:publicacionId')
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Body() createDto: CreateComentarioDto,
    @Req() request: any,
  ) {
    const usuarioId = request.user.id;
    return this.comentariosService.crear(publicacionId, usuarioId, createDto);
  }

  /**
   * GET /comentarios/publicacion/:publicacionId (Sprint 3).
   * Qué hace: Trae los comentarios de una publicación paginados, los más recientes primero.
   * Cómo lo hace: Normaliza limit (1 a 50) y offset (>= 0) y los pasa a comentariosService.listarPorPublicacion().
   */
  @Get('publicacion/:publicacionId')
  @HttpCode(HttpStatus.OK)
  async listarPorPublicacion(
    @Param('publicacionId', ParseObjectIdPipe) publicacionId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit ?? '5', 10) || 5, 1), 50);
    const offsetNum = Math.max(parseInt(offset ?? '0', 10) || 0, 0);
    return this.comentariosService.listarPorPublicacion(publicacionId, limitNum, offsetNum);
  }

  /**
   * PUT /comentarios/:id (Sprint 3).
   * Qué hace: Modifica el mensaje de un comentario propio y marca modificado: true.
   * Cómo lo hace: Extrae el ID del usuario desde request.user y llama a comentariosService.actualizar().
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateDto: UpdateComentarioDto,
    @Req() request: any,
  ) {
    const usuarioId = request.user.id;
    return this.comentariosService.actualizar(id, usuarioId, updateDto);
  }

  /**
   * DELETE /comentarios/:id (Sprint 3).
   * Qué hace: Da de baja lógica a un comentario y actualiza el contador del post.
   * Cómo lo hace: Llama a comentariosService.eliminar(id, request.user.id).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async eliminar(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    return this.comentariosService.eliminar(id, request.user);
  }
}

















