// Importamos utilidades de activación y excepciones de NestJS
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
// Importamos el servicio JWT de NestJS
import { JwtService } from '@nestjs/jwt';

/**
 * Guard que intercepta peticiones entrantes, extrae la cookie 'autorizacion' e inyecta el payload en request.user.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  // Inyectamos el servicio JwtService
  constructor(private jwtService: JwtService) {}

  // Determina si la petición actual tiene permiso de proceder
  canActivate(context: ExecutionContext): boolean {
    // Obtenemos la referencia al objeto Request de Express
    const request = context.switchToHttp().getRequest();
    // Buscamos la cookie nombrada 'autorizacion' en la solicitud
    const token = request.cookies['autorizacion'];

    // Si la cookie no existe, denegamos el acceso inmediatamente
    if (!token) {
      throw new UnauthorizedException('No tienes permisos. Debes iniciar sesión.');
    }

    try {
      // Verificamos criptográficamente el token y extraemos su contenido (payload)
      const payload = this.jwtService.verify(token);
      // Inyectamos los datos del usuario verificado en request.user para que los controladores lo lean
      request.user = payload;
      // Autorizamos la ejecución del endpoint
      return true;
    } catch (error) {
      // Si el token fue adulterado o ya venció, lanzamos error 401
      throw new UnauthorizedException('Token inválido o expirado. Vuelve a iniciar sesión.');
    }
  }
}