import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { RolUsuario } from '../../usuarios/schemas/usuario.schema.js';

/**
 * Guard de administrador (Sprint 4).
 * Qué hace: Permite el acceso solo si el usuario autenticado tiene perfil "administrador".
 * Cómo lo hace: Se usa siempre después de JwtGuard, que ya cargó request.user. Si el perfil no es
 * administrador responde 403 (el usuario está identificado pero no tiene permiso).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (request.user?.perfil !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Esta sección es solo para administradores.');
    }
    return true;
  }
}

