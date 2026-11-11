import { IsOptional, IsString, IsInt, Min, IsIn, IsMongoId, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORIAS_PUBLICACION } from '../schemas/publicacion.schema.js';


/**
 * DTO para parámetros de consulta del feed.
 * Qué hace: Transforma y valida los query params de paginación (offset, limit), orden y filtro por usuario.
 * Cómo lo hace: Usa Type(() => Number) para parsear enteros desde la URL y valida con class-validator.
 */
export class QueryPublicacionDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El offset debe ser un número entero' })
  @Min(0, { message: 'El offset no puede ser menor a 0' })
  offset?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(10, { message: 'El límite máximo es 10' })
  limit?: number = 5;

  @IsOptional()
  @IsString()
  @IsIn(['fecha', 'meGustas'], { message: 'El orden debe ser "fecha" o "meGustas"' })
  orden?: 'fecha' | 'meGustas' = 'fecha';

  @IsOptional()
  @IsMongoId({ message: 'El usuarioId debe ser un ObjectId válido de MongoDB' })
  usuarioId?: string;

  @IsOptional()
  @IsIn(CATEGORIAS_PUBLICACION, { message: 'La categoría no es válida' })
  categoria?: string;
}















// // Importamos validadores de class-validator
// import { IsOptional, IsString, IsInt, Min, IsIn, IsMongoId } from 'class-validator';
// // Importamos Type de class-transformer para transformar cadenas numéricas de URL a enteros
// import { Type } from 'class-transformer';
// // Importamos ApiPropertyOptional para documentar en Swagger
// import { ApiPropertyOptional } from '@nestjs/swagger';

// /**
//  * DTO que valida los parámetros de consulta (query params) para el listado del feed.
//  */
// export class QueryPublicacionDto {
//   // Desplazamiento para paginación incremental (por defecto 0)
//   @ApiPropertyOptional({ description: 'Cantidad de elementos a omitir (offset)', default: 0 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsInt({ message: 'El offset debe ser un número entero' })
//   @Min(0, { message: 'El offset no puede ser menor a 0' })
//   offset?: number = 0;

//   // Límite de elementos por página (por defecto 10)
//   @ApiPropertyOptional({ description: 'Límite de publicaciones por página', default: 10 })
//   @IsOptional()
//   @Type(() => Number)
//   @IsInt({ message: 'El límite debe ser un número entero' })
//   @Min(1, { message: 'El límite mínimo es 1' })
//   limit?: number = 10;

//   // Criterio de ordenamiento: por fecha cronológica o por popularidad de Me Gusta
//   @ApiPropertyOptional({ description: 'Criterio de ordenamiento', enum: ['fecha', 'meGustas'], default: 'fecha' })
//   @IsOptional()
//   @IsString()
//   @IsIn(['fecha', 'meGustas'], { message: 'El orden debe ser "fecha" o "meGustas"' })
//   orden?: 'fecha' | 'meGustas' = 'fecha';

//   // Identificador opcional para filtrar publicaciones de un usuario en particular
//   @ApiPropertyOptional({ description: 'Filtrar por ID de MongoDB de un usuario' })
//   @IsOptional()
//   @IsMongoId({ message: 'El usuarioId debe ser un ObjectId válido de MongoDB' })
//   usuarioId?: string;
// }