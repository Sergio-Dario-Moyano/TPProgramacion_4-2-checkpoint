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











