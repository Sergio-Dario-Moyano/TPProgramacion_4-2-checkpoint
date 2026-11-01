// Importamos decoradores para controladores HTTP de NestJS
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importamos los Guards de seguridad
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
// Importamos el servicio de usuarios
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
// Importamos el interceptor de subida de archivos Multer
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../cloudinary/multer.config.js';

/**
 * Controlador de administración de usuarios (restringido a usuarios con rol ADMIN).
 */
@ApiTags('usuarios')
@Controller('usuarios')
@UseGuards(JwtGuard, AdminGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Listar todos los usuarios
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todos los usuarios del sistema (Admin)' })
  async listarTodos() {
    const usuarios = await this.usuariosService.findAll();
    return { usuarios };
  }

  // Alta de nuevo usuario desde el panel
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo usuario con rol asignable (Admin)' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async crearUsuario(
    @Body() dto: CreateUsuarioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const usuario = await this.usuariosService.crearDesdeAdmin(dto, file);
    return {
      message: 'Usuario creado con éxito desde el panel de administración',
      usuario,
    };
  }

  // Baja lógica de un usuario
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deshabilitar un usuario (Baja lógica)' })
  async deshabilitar(@Param('id') id: string) {
    const usuario = await this.usuariosService.deshabilitar(id);
    return {
      message: 'Usuario deshabilitado correctamente',
      usuario,
    };
  }

  // Alta lógica de un usuario previamente deshabilitado
  @Post(':id/restaurar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rehabilitar un usuario (Alta lógica)' })
  async restaurar(@Param('id') id: string) {
    const usuario = await this.usuariosService.restaurar(id);
    return {
      message: 'Usuario restaurado correctamente',
      usuario,
    };
  }
}