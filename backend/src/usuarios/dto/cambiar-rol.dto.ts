import { IsEnum } from 'class-validator';
import { RolUsuario } from '../schemas/usuario.schema.js';

/**
 * DTO de cambio de rol (Sprint 4).
 * Qué hace: Valida que el nuevo perfil sea "usuario" o "administrador".
 */
export class CambiarRolDto {
  @IsEnum(RolUsuario, { message: 'El perfil debe ser "usuario" o "administrador"' })
  perfil!: RolUsuario;
}
