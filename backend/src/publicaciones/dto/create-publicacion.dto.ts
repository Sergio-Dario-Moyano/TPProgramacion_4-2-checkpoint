// Importamos validadores de class-validator
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
// Importamos decoradores para OpenAPI / Swagger
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO que valida los datos enviados al crear una nueva publicación.
 */
export class CreatePublicacionDto {
  // Título del post
  @ApiProperty({ description: 'Título del apunte o publicación', minLength: 1, maxLength: 100 })
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MinLength(1, { message: 'El título debe tener al menos 1 carácter' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  titulo!: string;

  // Contenido de la publicación
  @ApiProperty({ description: 'Descripción o apunte detallado', minLength: 1, maxLength: 500 })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
  @MinLength(1, { message: 'La descripción debe tener al menos 1 carácter' })
  @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
  descripcion!: string;
}