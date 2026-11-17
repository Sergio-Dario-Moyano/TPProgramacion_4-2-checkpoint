import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AutorizarDto } from './dto/autorizar.dto.js';
import { multerConfig } from '../cloudinary/multer.config.js';
import { borrarCookieSesion, extraerToken, setearCookieSesion } from './sesion.util.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /** Duración de la sesión en minutos (variable SESION_MINUTOS, 15 por defecto). */
  private get minutosSesion(): number {
    return Number(this.configService.get('SESION_MINUTOS') ?? 15);
  }

  /**
   * POST /auth/registro (Sprint 1 y 3) → 201
   * Qué hace: Registra al usuario, guarda su foto y abre la sesión.
   * Cómo lo hace: Multer recibe 'file'; el token se devuelve en el body y también en cookie HttpOnly.
   * Errores: 400 datos inválidos, 409 correo o nombre de usuario repetido.
   */
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async registro(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @Res({ passthrough: true }) response: Response,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const sesion = await this.authService.registro(createUsuarioDto, file);
    setearCookieSesion(response, sesion.token, this.minutosSesion);
    return { message: '¡Cuenta creada! Bienvenido a la party.', ...sesion };
  }

  /**
   * POST /auth/login (Sprint 1 y 3) → 200
   * Qué hace: Inicia sesión con correo o nombre de usuario.
   * Cómo lo hace: Valida credenciales y devuelve usuario + token (body y cookie).
   * Errores: 400 datos faltantes, 401 credenciales inválidas o cuenta deshabilitada.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const sesion = await this.authService.login(loginDto);
    setearCookieSesion(response, sesion.token, this.minutosSesion);
    return { message: 'Inicio de sesión exitoso', ...sesion };
  }

  /**
   * POST /auth/autorizar (Sprint 3) → 200 | 401
   * Qué hace: Valida que el token sea válido y no esté vencido. Si es válido devuelve los datos
   * del usuario; ante cualquier problema con el token responde 401.
   * Cómo lo hace: Toma el token del body ({ token }), del header Authorization (Bearer) o de la
   * cookie, en ese orden. Casos de 401: no llegó token, firma inválida, token vencido, o el
   * usuario del token no existe o está deshabilitado.
   */
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  async autorizar(@Body() body: AutorizarDto, @Req() request: Request) {
    const token = body?.token?.trim() || extraerToken(request);
    if (!token) throw new UnauthorizedException('No se envió ningún token');

    const resultado = await this.authService.autorizar(token);
    return { message: 'Token válido', ...resultado };
  }

  /**
   * POST /auth/refrescar (Sprint 3) → 200 | 401
   * Qué hace: Devuelve un token nuevo con la misma payload y 15 minutos de vencimiento.
   * Cómo lo hace: Valida el token actual y vuelve a firmar; actualiza también la cookie.
   */
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  async refrescar(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const tokenViejo = extraerToken(request);
    if (!tokenViejo) throw new UnauthorizedException('No hay una sesión para refrescar');

    const sesion = await this.authService.refrescar(tokenViejo);
    setearCookieSesion(response, sesion.token, this.minutosSesion);
    return { message: 'Sesión extendida', ...sesion };
  }

  /**
   * POST /auth/logout → 200
   * Qué hace: Cierra la sesión borrando la cookie (el front además descarta su token).
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    borrarCookieSesion(response);
    return { message: 'Sesión cerrada correctamente' };
  }
}




