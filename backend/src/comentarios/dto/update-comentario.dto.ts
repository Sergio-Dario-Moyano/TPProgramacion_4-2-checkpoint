import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * DTO para la edición en línea de comentarios (Sprint 3).
 * Qué hace: Valida el nuevo texto al actualizar un comentario.
 * Cómo lo hace: Comprueba límites de 1 a 150 caracteres con class-validator.
 */
export class UpdateComentarioDto {
  @IsString({ message: 'El comentario debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El texto no puede quedar vacío' })
  @MinLength(1, { message: 'El comentario debe tener al menos 1 carácter' })
  @MaxLength(150, { message: 'El comentario no puede superar los 150 caracteres' })
  texto!: string;
}












// // Importamos validadores de class-validator
// import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
// // Importamos ApiProperty para Swagger
// import { ApiProperty } from '@nestjs/swagger';

// /**
//  * DTO que valida el nuevo texto al editar un comentario existente en línea.
//  */
// export class UpdateComentarioDto {
//   // Texto editado con tope estricto de 150 caracteres
//   @ApiProperty({ description: 'Nuevo texto del comentario', minLength: 1, maxLength: 150 })
//   @IsString({ message: 'El comentario debe ser una cadena de texto' })
//   @IsNotEmpty({ message: 'El texto no puede quedar vacío' })
//   @MinLength(1, { message: 'El comentario debe tener al menos 1 carácter' })
//   @MaxLength(150, { message: 'El comentario no puede superar los 150 caracteres' })
//   texto!: string;
// }