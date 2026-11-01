// Importamos los validadores de class-validator
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
// Importamos el enum de roles
import { RolUsuario } from '../schemas/usuario.schema.js';

/**
 * DTO que define y valida los datos recibidos al crear o registrar un nuevo usuario.
 */
export class CreateUsuarioDto {
  // Nombre obligatorio
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  nombre!: string;

  // Apellido obligatorio
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  apellido!: string;

  // Correo electrónico obligatorio con validación de dominios admitidos
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El formato del correo es inválido' })
  @Matches(/^[a-zA-Z0-9._%+-]+@(gmail\.com|hotmail\.com|outlook\.com|utn\.edu\.ar)$/, {
    message: 'El correo debe ser de dominio gmail, hotmail, outlook o utn.edu.ar',
  })
  correo!: string;

  // Alias de usuario con límite de caracteres
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  @MaxLength(15, { message: 'El nombre de usuario no puede superar los 15 caracteres' })
  nombreUsuario!: string;

  // Contraseña con requerimiento de 8 caracteres, una mayúscula y un número
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe contener al menos una mayúscula y un número',
  })
  password!: string;

  // Campo opcional de confirmación en el DTO
  @IsOptional()
  @IsString()
  repetirPassword?: string;

  // Fecha de nacimiento procesable
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  fechaNacimiento!: Date | string;

  // Descripción opcional de hasta 250 caracteres
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'La descripción no puede superar los 250 caracteres' })
  descripcion?: string;

  // Rol de la cuenta asignable
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El perfil debe ser usuario o administrador' })
  perfil?: RolUsuario;
}