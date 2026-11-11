import { IsDateString, IsOptional } from 'class-validator';

/**
 * Lapso de tiempo de las estadísticas (Sprint 4).
 * Qué hace: Recibe desde y hasta en formato YYYY-MM-DD.
 * Cómo lo hace: Ambos opcionales; si faltan se usan los últimos 30 días.
 */
export class RangoFechasDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha "desde" no es válida (formato YYYY-MM-DD)' })
  desde?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha "hasta" no es válida (formato YYYY-MM-DD)' })
  hasta?: string;
}
