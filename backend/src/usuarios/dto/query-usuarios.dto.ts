import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Filtros del listado de usuarios del dashboard (Sprint 4).
 * Qué hace: Permite buscar por texto y filtrar por estado.
 * Cómo lo hace: busqueda se compara contra nombre, apellido, correo y nombre de usuario.
 */
export class QueryUsuariosDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  busqueda?: string;

  @IsOptional()
  @IsIn(['todos', 'activos', 'inactivos'], { message: 'estado debe ser todos, activos o inactivos' })
  estado?: 'todos' | 'activos' | 'inactivos' = 'todos';
}
