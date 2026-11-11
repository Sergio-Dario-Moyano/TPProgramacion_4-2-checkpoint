import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { CambiarRolDto } from './dto/cambiar-rol.dto.js';
import { JwtGuard } from '../auth/guards/jwt.guard.js';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { multerConfig } from '../cloudinary/multer.config.js';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
import { firmarToken, vencimientoToken } from '../auth/token.util.js';
import { setearCookieSesion } from '../auth/sesion.util.js';

@Controller('usuarios')
@UseGuards(JwtGuard)
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ---------------------------------------------------------------
  // Mi perfil (cualquier usuario logueado)
  // ---------------------------------------------------------------

  /**
   * PUT /usuarios/perfil
   * Qué hace: Edita los datos del usuario logueado y su foto de perfil.
   * Cómo lo hace: Recibe multipart/form-data, delega en usuariosService.actualizarPerfil() y
   * emite un token nuevo porque el payload incluye correo y nombre de usuario.
   */
  @Put('perfil')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async actualizarPerfil(
    @Req() request: any,
    @Body() dto: UpdatePerfilDto,
    @Res({ passthrough: true }) response: Response,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const usuario = await this.usuariosService.actualizarPerfil(request.user.id, dto, file);
    const token = firmarToken(this.jwtService, usuario);
    setearCookieSesion(response, token, Number(this.configService.get('SESION_MINUTOS') ?? 15));

    return {
      message: 'Perfil actualizado',
      usuario,
      token,
      expiraEn: vencimientoToken(this.jwtService, token),
    };
  }

  /**
   * PUT /usuarios/perfil/password
   * Qué hace: Cambia la contraseña del usuario logueado.
   * Cómo lo hace: Valida la actual y guarda la nueva encriptada.
   */
  @Put('perfil/password')
  @HttpCode(HttpStatus.OK)
  async cambiarPassword(@Req() request: any, @Body() dto: CambiarPasswordDto) {
    await this.usuariosService.cambiarPassword(request.user.id, dto);
    return { message: 'Contraseña actualizada' };
  }

  // ---------------------------------------------------------------
  // Administración (Sprint 4) - requiere perfil administrador
  // ---------------------------------------------------------------

  /**
   * GET /usuarios
   * Qué hace: Lista los usuarios para el dashboard.
   * Cómo lo hace: Acepta los filtros busqueda y estado (todos | activos | inactivos).
   */
  @Get()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async listar(@Query() query: QueryUsuariosDto) {
    return this.usuariosService.listar(query.busqueda, query.estado);
  }

  /**
   * POST /usuarios
   * Qué hace: Da de alta un usuario nuevo eligiendo su perfil (usuario o administrador).
   * Cómo lo hace: Mismos datos y validaciones que el registro; no inicia sesión como el usuario creado.
   */
  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async crear(@Body() dto: CreateUsuarioDto, @UploadedFile() file?: Express.Multer.File) {
    const usuario = await this.usuariosService.crearUsuario(dto, file);
    return { message: 'Usuario creado', usuario };
  }

  /**
   * DELETE /usuarios/:id
   * Qué hace: Baja lógica. El usuario deshabilitado no puede iniciar sesión.
   * Cómo lo hace: Marca activo: false. Sus peticiones siguientes reciben 401 desde JwtGuard.
   */
  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deshabilitar(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    const usuario = await this.usuariosService.cambiarEstado(id, false, request.user.id);
    return { message: 'Usuario deshabilitado', usuario };
  }

  /**
   * POST /usuarios/:id/habilitar
   * Qué hace: Alta lógica. Rehabilita a un usuario deshabilitado.
   * Cómo lo hace: Marca activo: true.
   */
  @Post(':id/habilitar')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async habilitar(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
    const usuario = await this.usuariosService.cambiarEstado(id, true, request.user.id);
    return { message: 'Usuario habilitado', usuario };
  }

  /**
   * PATCH /usuarios/:id/perfil
   * Qué hace: Cambia el rol de un usuario existente (usuario ↔ administrador).
   * Cómo lo hace: Body { perfil }. El cambio aplica en la próxima petición del usuario afectado,
   * porque JwtGuard toma el perfil desde la base de datos.
   */
  @Patch(':id/perfil')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async cambiarRol(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CambiarRolDto,
    @Req() request: any,
  ) {
    const usuario = await this.usuariosService.cambiarRol(id, dto.perfil, request.user.id);
    const texto = dto.perfil === 'administrador' ? 'ahora es administrador' : 'ahora es usuario';
    return { message: `@${usuario.nombreUsuario} ${texto}`, usuario };
  }
}
















// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   HttpCode,
//   HttpStatus,
//   Param,
//   Post,
//   Put,
//   Query,
//   Req,
//   Res,
//   UploadedFile,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import type { Response } from 'express';
// import { UsuariosService } from './usuarios.service.js';
// import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
// import { UpdatePerfilDto } from './dto/update-perfil.dto.js';
// import { CambiarPasswordDto } from './dto/cambiar-password.dto.js';
// import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
// import { JwtGuard } from '../auth/guards/jwt.guard.js';
// import { AdminGuard } from '../auth/guards/admin.guard.js';
// import { multerConfig } from '../cloudinary/multer.config.js';
// import { ParseObjectIdPipe } from '../common/parse-object-id.pipe.js';
// import { firmarToken, vencimientoToken } from '../auth/token.util.js';
// import { setearCookieSesion } from '../auth/sesion.util.js';

// @Controller('usuarios')
// @UseGuards(JwtGuard)
// export class UsuariosController {
//   constructor(
//     private readonly usuariosService: UsuariosService,
//     private readonly jwtService: JwtService,
//     private readonly configService: ConfigService,
//   ) {}

//   // ---------------------------------------------------------------
//   // Mi perfil (cualquier usuario logueado)
//   // ---------------------------------------------------------------

//   /**
//    * PUT /usuarios/perfil
//    * Qué hace: Edita los datos del usuario logueado y su foto de perfil.
//    * Cómo lo hace: Recibe multipart/form-data, delega en usuariosService.actualizarPerfil() y
//    * emite un token nuevo porque el payload incluye correo y nombre de usuario.
//    */
//   @Put('perfil')
//   @HttpCode(HttpStatus.OK)
//   @UseInterceptors(FileInterceptor('file', multerConfig))
//   async actualizarPerfil(
//     @Req() request: any,
//     @Body() dto: UpdatePerfilDto,
//     @Res({ passthrough: true }) response: Response,
//     @UploadedFile() file?: Express.Multer.File,
//   ) {
//     const usuario = await this.usuariosService.actualizarPerfil(request.user.id, dto, file);
//     const token = firmarToken(this.jwtService, usuario);
//     setearCookieSesion(response, token, Number(this.configService.get('SESION_MINUTOS') ?? 15));

//     return {
//       message: 'Perfil actualizado',
//       usuario,
//       token,
//       expiraEn: vencimientoToken(this.jwtService, token),
//     };
//   }

//   /**
//    * PUT /usuarios/perfil/password
//    * Qué hace: Cambia la contraseña del usuario logueado.
//    * Cómo lo hace: Valida la actual y guarda la nueva encriptada.
//    */
//   @Put('perfil/password')
//   @HttpCode(HttpStatus.OK)
//   async cambiarPassword(@Req() request: any, @Body() dto: CambiarPasswordDto) {
//     await this.usuariosService.cambiarPassword(request.user.id, dto);
//     return { message: 'Contraseña actualizada' };
//   }

//   // ---------------------------------------------------------------
//   // Administración (Sprint 4) - requiere perfil administrador
//   // ---------------------------------------------------------------

//   /**
//    * GET /usuarios
//    * Qué hace: Lista los usuarios para el dashboard.
//    * Cómo lo hace: Acepta los filtros busqueda y estado (todos | activos | inactivos).
//    */
//   @Get()
//   @UseGuards(AdminGuard)
//   @HttpCode(HttpStatus.OK)
//   async listar(@Query() query: QueryUsuariosDto) {
//     return this.usuariosService.listar(query.busqueda, query.estado);
//   }

//   /**
//    * POST /usuarios
//    * Qué hace: Da de alta un usuario nuevo eligiendo su perfil (usuario o administrador).
//    * Cómo lo hace: Mismos datos y validaciones que el registro; no inicia sesión como el usuario creado.
//    */
//   @Post()
//   @UseGuards(AdminGuard)
//   @HttpCode(HttpStatus.CREATED)
//   @UseInterceptors(FileInterceptor('file', multerConfig))
//   async crear(@Body() dto: CreateUsuarioDto, @UploadedFile() file?: Express.Multer.File) {
//     const usuario = await this.usuariosService.crearUsuario(dto, file);
//     return { message: 'Usuario creado', usuario };
//   }

//   /**
//    * DELETE /usuarios/:id
//    * Qué hace: Baja lógica. El usuario deshabilitado no puede iniciar sesión.
//    * Cómo lo hace: Marca activo: false. Sus peticiones siguientes reciben 401 desde JwtGuard.
//    */
//   @Delete(':id')
//   @UseGuards(AdminGuard)
//   @HttpCode(HttpStatus.OK)
//   async deshabilitar(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
//     const usuario = await this.usuariosService.cambiarEstado(id, false, request.user.id);
//     return { message: 'Usuario deshabilitado', usuario };
//   }

//   /**
//    * POST /usuarios/:id/habilitar
//    * Qué hace: Alta lógica. Rehabilita a un usuario deshabilitado.
//    * Cómo lo hace: Marca activo: true.
//    */
//   @Post(':id/habilitar')
//   @UseGuards(AdminGuard)
//   @HttpCode(HttpStatus.OK)
//   async habilitar(@Param('id', ParseObjectIdPipe) id: string, @Req() request: any) {
//     const usuario = await this.usuariosService.cambiarEstado(id, true, request.user.id);
//     return { message: 'Usuario habilitado', usuario };
//   }
// }