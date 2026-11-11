import { JwtService } from '@nestjs/jwt';

/**
 * Firma el JWT de un usuario.
 * Qué hace: Genera un token con id, correo, nombre de usuario y rol (Sprint 3).
 * Cómo lo hace: jwtService.sign() usa el secreto y el vencimiento configurados en AuthModule.
 * Se comparte entre AuthService y UsuariosController (al editar el perfil cambia el payload).
 */
export function firmarToken(jwtService: JwtService, usuario: any): string {
  const payload = {
    id: usuario._id?.toString(),
    correo: usuario.correo,
    nombreUsuario: usuario.nombreUsuario,
    perfil: usuario.perfil,
  };
  return jwtService.sign(payload);
}

/**
 * Calcula cuándo vence un token.
 * Qué hace: Devuelve el vencimiento en milisegundos para que el front programe el aviso de sesión.
 * Cómo lo hace: Lee el claim exp (segundos) con jwtService.decode().
 */
export function vencimientoToken(jwtService: JwtService, token: string): number {
  const decodificado: any = jwtService.decode(token);
  return decodificado?.exp ? decodificado.exp * 1000 : Date.now();
}