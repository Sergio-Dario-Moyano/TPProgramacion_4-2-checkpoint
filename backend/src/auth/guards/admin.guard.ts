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














// // Importamos utilidades de activación y la excepción 403 Forbidden
// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// // Importamos el enum de roles de usuario
// import { RolUsuario } from '../../usuarios/schemas/usuario.schema.js';

// /**
//  * Guard que garantiza que el usuario autenticado posea perfil de 'administrador'.
//  */
// @Injectable()
// export class AdminGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     // Obtenemos el objeto Request
//     const request = context.switchToHttp().getRequest();
//     // Leemos el usuario inyectado previamente por JwtGuard
//     const user = request.user;

//     // Evaluamos si el perfil del usuario coincide con el rol de ADMIN
//     if (user && user.perfil === RolUsuario.ADMIN) {
//       // Acceso concedido
//       return true;
//     }

//     // Si no tiene privilegios de administrador, lanzamos un error 403
//     throw new ForbiddenException('Acceso denegado. Se requieren permisos de administrador.');
//   }
// }