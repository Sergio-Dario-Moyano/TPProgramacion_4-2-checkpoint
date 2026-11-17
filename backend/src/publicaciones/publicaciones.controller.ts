import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublicacionesService } from './publicaciones.service.js';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';
import { multerConfig } from '../cloudinary/multer.config.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';

/**
 * Controlador de publicaciones.
 * Todas las rutas requieren sesión (401 sin token o con token vencido).
 */
@Controller('publicaciones')
@UseGuards(JwtGuard)
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  /** POST /publicaciones → 201. Título, mensaje, categoría, juego e imagen opcional ('file'). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async crear(
    @Body() dto: CreatePublicacionDto,
    @Req() request: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const publicacion = await this.publicacionesService.crear(dto, request.user.id, file);
    return { message: 'Publicación creada', publicacion };
  }

  /** GET /publicaciones?offset&limit&orden=fecha|meGustas&usuarioId&categoria → 200 */
  @Get()
  @HttpCode(HttpStatus.OK)
  async listar(@Query() queryDto: QueryPublicacionDto) {
    return this.publicacionesService.listar(queryDto);
  }

  /** GET /publicaciones/:id → 200 | 404 */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async buscarPorId(@Param('id', ParseObjectIdPipe) id: string) {
    const publicacion = await this.publicacionesService.buscarPorId(id);
    return { publicacion };
  }

  /** PUT /publicaciones/:id → 200 | 403 (no es el autor) | 404 */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async actualizar(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdatePublicacionDto,
    @Req() request: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const publicacion = await this.publicacionesService.actualizar(id, request.user.id, dto, file);
    return { message: 'Publicación actualizada', publicacion };
  }

  /** DELETE /publicaciones/:id → 200 | 403 | 404. Baja lógica (autor o administrador). */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async darDeBaja(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    const publicacion = await this.publicacionesService.darDeBaja(id, request.user);
    return { message: 'Publicación eliminada', publicacion };
  }

  /** POST /publicaciones/:id/like → 201 | 404 | 409 (ya tenía me gusta) */
  @Post(':id/like')
  @HttpCode(HttpStatus.CREATED)
  async darMeGusta(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    const publicacion = await this.publicacionesService.darMeGusta(id, request.user.id);
    return { message: 'Me gusta agregado', publicacion };
  }

  /** DELETE /publicaciones/:id/like → 200 | 404 | 409 (no tenía me gusta) */
  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  async quitarMeGusta(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    const publicacion = await this.publicacionesService.quitarMeGusta(id, request.user.id);
    return { message: 'Me gusta eliminado', publicacion };
  }
}

