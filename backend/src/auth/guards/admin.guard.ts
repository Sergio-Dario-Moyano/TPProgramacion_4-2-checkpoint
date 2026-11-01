// Importamos utilidades de activación y la excepción 403 Forbidden
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// Importamos el enum de roles de usuario
import { RolUsuario } from '../../usuarios/schemas/usuario.schema.js';

/**
 * Guard que garantiza que el usuario autenticado posea perfil de 'administrador'.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Obtenemos el objeto Request
    const request = context.switchToHttp().getRequest();
    // Leemos el usuario inyectado previamente por JwtGuard
    const user = request.user;

    // Evaluamos si el perfil del usuario coincide con el rol de ADMIN
    if (user && user.perfil === RolUsuario.ADMIN) {
      // Acceso concedido
      return true;
    }

    // Si no tiene privilegios de administrador, lanzamos un error 403
    throw new ForbiddenException('Acceso denegado. Se requieren permisos de administrador.');
  }
}