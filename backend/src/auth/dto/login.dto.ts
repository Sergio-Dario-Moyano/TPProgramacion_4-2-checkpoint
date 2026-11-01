// Importamos el decorador ApiProperty para la documentación automática con Swagger
import { ApiProperty } from '@nestjs/swagger';
// Importamos los validadores de class-validator para sanear las entradas
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Objeto de transferencia de datos (DTO) para el inicio de sesión.
 * Cumple con la consigna de permitir el acceso mediante correo electrónico o alias de usuario.
 */
export class LoginDto {
  // Credencial única de acceso (puede ser correo electrónico o nombre de usuario)
  @ApiProperty({ description: 'Correo electrónico o nombre de usuario registrado' })
  @IsNotEmpty({ message: 'El correo o usuario es obligatorio' })
  @IsString()
  credencial!: string;

  // Contraseña en texto plano para verificar contra el hash de la base de datos
  @ApiProperty({ description: 'Contraseña en texto plano del usuario' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString()
  password!: string;
}