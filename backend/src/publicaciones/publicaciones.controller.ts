// Importamos decoradores para controladores HTTP de NestJS
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
// Importamos el interceptor de Multer para recibir imágenes
import { FileInterceptor } from '@nestjs/platform-express';
// Importamos decoradores de OpenAPI / Swagger
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
// Importamos el servicio de publicaciones
import { PublicacionesService } from './publicaciones.service.js';
// Importamos los DTOs de creación y consulta
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { QueryPublicacionDto } from './dto/query-publicacion.dto.js';
// Importamos la configuración en memoria de Multer
import { multerConfig } from '../cloudinary/multer.config.js';
// Importamos el Guard de JWT para validar la cookie de autorización
import { JwtGuard } from '../auth/guards/jwt.guard.js';

/**
 * Controlador para la interacción con publicaciones del feed social.
 */
@ApiTags('publicaciones')
@Controller('publicaciones')
@UseGuards(JwtGuard) // Todas las rutas requieren sesión activa en cookies
export class PublicacionesController {
  constructor(private readonly publicacionesService: PublicacionesService) {}

  /**
   * Endpoint para crear una nueva publicación con imagen opcional.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva publicación' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Publicación creada exitosamente' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async crear(
    @Body() createPublicacionDto: CreatePublicacionDto,
    @Req() request: any, // Extraemos el usuario inyectado por JwtGuard
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Obtenemos el ID del usuario directamente desde el token validado
    const usuarioId = request.user.id;
    const publicacion = await this.publicacionesService.crear(createPublicacionDto, usuarioId, file);
    return {
      message: 'Publicación creada con éxito',
      publicacion,
    };
  }

  /**
   * Endpoint para listar publicaciones con paginación incremental y ordenamiento dinámico.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar publicaciones con paginación y ordenamiento' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Listado de publicaciones obtenido' })
  async listar(@Query() queryDto: QueryPublicacionDto) {
    const publicaciones = await this.publicacionesService.listar(queryDto);
    return { publicaciones };
  }

  /**
   * Endpoint para dar de baja lógica una publicación (autor original o administrador).
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar de baja una publicación (Baja lógica)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Publicación eliminada correctamente' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No tiene permisos' })
  async darDeBaja(@Param('id') id: string, @Req() request: any) {
    const usuarioIdSeguro = request.user.id;
    const publicacion = await this.publicacionesService.darDeBaja(id, usuarioIdSeguro);
    return {
      message: 'Publicación eliminada correctamente',
      publicacion,
    };
  }

  /**
   * Endpoint para dar Me Gusta a una publicación.
   */
  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dar me gusta a una publicación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Me gusta registrado' })
  async darMeGusta(@Param('id') id: string, @Req() request: any) {
    const usuarioIdSeguro = request.user.id;
    const publicacion = await this.publicacionesService.darMeGusta(id, usuarioIdSeguro);
    return {
      message: 'Me gusta agregado',
      publicacion,
    };
  }

  /**
   * Endpoint para remover un Me Gusta dado previamente.
   */
  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar me gusta de una publicación' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Me gusta eliminado' })
  async quitarMeGusta(@Param('id') id: string, @Req() request: any) {
    const usuarioIdSeguro = request.user.id;
    const publicacion = await this.publicacionesService.quitarMeGusta(id, usuarioIdSeguro);
    return {
      message: 'Me gusta eliminado',
      publicacion,
    };
  }

  /**
   * Endpoint para obtener una publicación específica por su ID.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una publicación por ID' })
  async buscarPorId(@Param('id') id: string) {
    const publicacion = await this.publicacionesService.buscarPorId(id);
    return { publicacion };
  }
}