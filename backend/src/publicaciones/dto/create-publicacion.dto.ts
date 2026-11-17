import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CATEGORIAS_PUBLICACION } from '../schemas/publicacion.schema.js';

/**
 * DTO de alta de publicación (Sprint 2).
 * Qué hace: Valida título, mensaje y los datos gamer opcionales (categoría y juego).
 * Cómo lo hace: class-validator; la imagen opcional llega aparte como archivo 'file'.
 */
export class CreatePublicacionDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  titulo!: string;

  @IsString({ message: 'El mensaje debe ser un texto' })
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  descripcion!: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUBLICACION, { message: 'La categoría no es válida' })
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'El nombre del juego no puede superar los 60 caracteres' })
  juego?: string;
}




