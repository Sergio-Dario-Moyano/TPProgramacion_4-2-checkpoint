import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../../usuarios/usuarios.service.js';
import { extraerToken } from '../sesion.util.js';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usuariosService: UsuariosService,
  ) {}

  /**
   * Determina si la petición entrante está autorizada.
   * Qué hace: Valida el JWT (header Bearer o cookie) y que el usuario siga existiendo y habilitado.
   * Cómo lo hace: Verifica la firma con jwtService.verify(), busca al usuario en MongoDB y carga
   * request.user con el payload y el perfil actualizado. Cualquier falla devuelve 401.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extraerToken(request);

    if (!token) {
      throw new UnauthorizedException('No iniciaste sesión. Ingresá para continuar.');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Tu sesión expiró o el token no es válido. Volvé a ingresar.');
    }

    const usuario = await this.usuariosService.findOne(payload.id);
    if (!usuario) {
      throw new UnauthorizedException('El usuario de la sesión ya no existe.');
    }
    if (!usuario.activo) {
      throw new UnauthorizedException('Tu cuenta fue deshabilitada por un administrador.');
    }

    // El perfil se toma de la base para reflejar cambios de rol sin esperar un token nuevo
    request.user = { ...payload, id: usuario._id.toString(), perfil: usuario.perfil };
    return true;
  }
}


