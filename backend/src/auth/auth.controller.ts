// Importamos decoradores para controladores HTTP de NestJS
import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
// Importamos el servicio de autenticación
import { AuthService } from './auth.service.js';
// Importamos el DTO de creación de usuario
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
// Importamos decoradores de OpenAPI / Swagger
import { ApiTags, ApiOperation } from '@nestjs/swagger';
// Importamos el interceptor de archivos de Multer
import { FileInterceptor } from '@nestjs/platform-express';
// Importamos la configuración de memoria y restricciones de Multer
import { multerConfig } from '../cloudinary/multer.config.js';
// Importamos el servicio de Cloudinary
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
// Importamos el servicio de configuración para leer variables de entorno
import { ConfigService } from '@nestjs/config';
// Importamos el DTO de inicio de sesión
import { LoginDto } from './dto/login.dto.js';
// Importamos los tipos Request y Response de Express
import type { Request, Response } from 'express';

/**
 * Controlador de autenticación: gestiona el ciclo de vida de la sesión y las cookies HttpOnly.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // Inyectamos los servicios requeridos
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Método privado auxiliar encargado de empaquetar y estampar la cookie HttpOnly en la respuesta.
   */
  private setAuthCookie(response: Response, token: string): void {
    // Fijamos la cookie 'autorizacion' con atributos estrictos de seguridad
    response.cookie('autorizacion', token, {
      httpOnly: true, // Impide que el código JavaScript del navegador lea el token (anti-XSS)
      sameSite: 'none', // Permite el envío en solicitudes cross-origin con credenciales
      secure: true, // Obliga a la transmisión sobre canales cifrados HTTPS
      expires: new Date(Date.now() + 1000 * 60 * 15), // Expira exactamente a los 15 minutos
    });
  }

  /**
   * Endpoint de registro de nuevos usuarios con subida opcional de imagen a Cloudinary.
   */
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async registro(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @UploadedFile() file: Express.Multer.File,
    @Res({ passthrough: true }) response: Response,
  ) {
    let imagenUrl: string | undefined = undefined;

    // Si se adjuntó un archivo de imagen, lo subimos a Cloudinary en la carpeta fotos_perfil
    if (file) {
      const upload = await this.cloudinaryService.subirImagen(file, 'fotos_perfil');
      imagenUrl = upload?.secure_url;
    } else {
      // Si no hay archivo adjunto, usamos el avatar predeterminado definido en .env
      imagenUrl = this.configService.get<string>('DEFAULT_PROFILE_IMAGE_URL');
    }

    // Creamos la cuenta y obtenemos el token inicial firmado
    const { token, usuario } = await this.authService.registro(createUsuarioDto, imagenUrl);

    // Asignamos la cookie HttpOnly en la respuesta HTTP
    this.setAuthCookie(response, token);

    // Devolvemos la confirmación y los datos del usuario sanitizado
    return { message: 'Usuario registrado exitosamente', usuario };
  }

  /**
   * Endpoint de inicio de sesión mediante credencial y contraseña.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo o alias' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Verificamos credenciales y recuperamos el token y usuario
    const { token, usuario } = await this.authService.login(loginDto);

    // Seteamos la cookie de autorización por 15 minutos
    this.setAuthCookie(response, token);

    // Respondemos con el mensaje de éxito y la entidad de usuario
    return { message: 'Inicio de sesión exitoso', usuario };
  }

  /**
   * Endpoint invocado al abrir la aplicación para validar la vigencia de la sesión actual.
   */
  @Post('autorizar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token de sesión actual en cookies' })
  async autorizar(@Req() request: Request) {
    // Leemos la cookie 'autorizacion' desde el encabezado Cookie
    const token = request.cookies['autorizacion'];
    // Si no hay cookie presente, denegamos el acceso con 401
    if (!token) throw new UnauthorizedException('No hay token de sesión');

    // Comprobamos la validez de la firma del token
    const payload = this.authService.verificarToken(token);
    // Recuperamos los datos completos y actualizados del usuario en base de datos
    const usuarioCompleto = await this.authService.buscarPorId(payload.id);

    // Respondemos con el usuario verificado
    return {
      message: 'Token válido',
      usuario: usuarioCompleto,
    };
  }

  /**
   * Endpoint invocado por ContadorService para extender la sesión por otros 15 minutos.
   */
  @Post('refrescar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar el token por otros 15 minutos' })
  async refrescar(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Leemos la cookie con el token activo
    const tokenViejo = request.cookies['autorizacion'];
    // Si no existe el token, devolvemos un error 400 Bad Request
    if (!tokenViejo) throw new BadRequestException('Token no proporcionado');

    // Generamos un nuevo token válido por otros 15 minutos
    const nuevoToken = await this.authService.refrescar(tokenViejo);

    // Actualizamos la cookie con la nueva expiración
    this.setAuthCookie(response, nuevoToken);

    // Notificamos el éxito de la extensión de sesión
    return { message: 'Token refrescado exitosamente' };
  }

  /**
   * Endpoint de cierre de sesión: invalida y expira la cookie HttpOnly de inmediato.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar cookies' })
  async logout(@Res({ passthrough: true }) response: Response) {
    // Destruimos la cookie asignándole fecha de expiración en la época Unix (año 1970)
    response.cookie('autorizacion', '', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      expires: new Date(0),
    });

    // Confirmamos el cierre de sesión
    return { message: 'Sesión cerrada correctamente' };
  }
}