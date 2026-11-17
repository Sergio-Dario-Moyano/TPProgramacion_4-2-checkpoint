import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para inicio de sesión.
 * Qué hace: Valida las credenciales enviadas por el usuario en la petición POST de login.
 * Cómo lo hace: Comprueba que credencial y password sean cadenas no vacías.
 */
export class LoginDto {
  // @ApiProperty({ description: 'Correo electrónico o nombre de usuario registrado' })
  @IsNotEmpty({ message: 'El correo o usuario es obligatorio' })
  @IsString({ message: 'El correo o usuario debe ser una cadena de texto' })
  credencial!: string;

  // @ApiProperty({ description: 'Contraseña en texto plano del usuario' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  password!: string;
}



