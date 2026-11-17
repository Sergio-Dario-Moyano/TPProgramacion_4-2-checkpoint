import { IsOptional, IsString } from 'class-validator';

/**
 * DTO de POST /auth/autorizar.
 * Qué hace: Permite enviar el token a validar en el body: { "token": "..." }.
 * Cómo lo hace: El campo es opcional. Si no llega en el body, el controller lo busca en el
 * header Authorization (Bearer) y, por último, en la cookie de sesión.
 */
export class AutorizarDto {
  @IsOptional()
  @IsString({ message: 'El token debe ser una cadena de texto' })
  token?: string;
}
