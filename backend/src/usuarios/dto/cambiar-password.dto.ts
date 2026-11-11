import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/**
 * DTO de cambio de contraseña desde Mi Perfil.
 * Qué hace: Pide la contraseña actual y la nueva (con las mismas reglas que el registro).
 * Cómo lo hace: class-validator valida formato; la coincidencia y la contraseña actual se validan en el servicio.
 */
export class CambiarPasswordDto {
  @IsNotEmpty({ message: 'Ingresá tu contraseña actual' })
  @IsString()
  passwordActual!: string;

  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La nueva contraseña debe contener al menos una mayúscula y un número',
  })
  passwordNueva!: string;

  @IsNotEmpty({ message: 'Repetí la nueva contraseña' })
  @IsString()
  repetirPassword!: string;
}
