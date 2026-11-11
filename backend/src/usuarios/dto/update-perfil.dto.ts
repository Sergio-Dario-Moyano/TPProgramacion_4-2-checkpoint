import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO de edición de perfil.
 * Qué hace: Valida los datos que un usuario puede modificar de su propio perfil.
 * Cómo lo hace: Todos los campos son opcionales (solo se actualiza lo que llega). El rol y el
 * estado de la cuenta no se pueden cambiar desde acá.
 */
export class UpdatePerfilDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  apellido?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  correo?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre de usuario no puede superar los 15 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'El nombre de usuario solo puede tener letras, números y guion bajo',
  })
  nombreUsuario?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento no es válida' })
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'La descripción no puede superar los 250 caracteres' })
  descripcion?: string;

  // Llega como texto porque el formulario viaja en multipart/form-data
  @IsOptional()
  @IsIn(['true', 'false'], { message: 'quitarImagen debe ser "true" o "false"' })
  quitarImagen?: string;
}
