import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CATEGORIAS_PUBLICACION } from '../schemas/publicacion.schema.js';

/**
 * DTO de edición de publicación.
 * Qué hace: Permite al autor cambiar título, mensaje, categoría, juego e imagen.
 * Cómo lo hace: Todos los campos son opcionales; quitarImagen='true' elimina la imagen actual.
 */
export class UpdatePublicacionDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título no puede quedar vacío' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres' })
  titulo?: string;

  @IsOptional()
  @IsString({ message: 'El mensaje debe ser un texto' })
  @IsNotEmpty({ message: 'El mensaje no puede quedar vacío' })
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  descripcion?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUBLICACION, { message: 'La categoría no es válida' })
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60, { message: 'El nombre del juego no puede superar los 60 caracteres' })
  juego?: string;

  @IsOptional()
  @IsIn(['true', 'false'], { message: 'quitarImagen debe ser "true" o "false"' })
  quitarImagen?: string;
}
