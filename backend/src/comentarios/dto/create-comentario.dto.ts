import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para la publicación de comentarios.
 * Qué hace: Valida que el texto del comentario contenga entre 1 y 150 caracteres.
 * Cómo lo hace: Utiliza decoradores de class-validator (IsNotEmpty, MinLength, MaxLength).
 */
export class CreateComentarioDto {
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  @MinLength(1, { message: 'El comentario debe tener al menos 1 carácter' })
  @MaxLength(150, { message: 'El comentario no puede superar los 150 caracteres' })
  texto!: string;
}

















// // Importamos validadores de class-validator
// import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
// // Importamos ApiProperty para Swagger
// import { ApiProperty } from '@nestjs/swagger';

// /**
//  * DTO que valida el cuerpo enviado al publicar un comentario.
//  */
// export class CreateComentarioDto {
//   // Texto del comentario con tope estricto de 150 caracteres
//   @ApiProperty({ description: 'Contenido del comentario', minLength: 1, maxLength: 150 })
//   @IsString({ message: 'El comentario debe ser una cadena de texto' })
//   @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
//   @MinLength(1, { message: 'El comentario debe tener al menos 1 carácter' })
//   @MaxLength(150, { message: 'El comentario no puede superar los 150 caracteres' })
//   texto!: string;
// }