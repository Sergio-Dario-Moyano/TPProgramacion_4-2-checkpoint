
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

/**
 * Pipe reutilizable para validar identificadores de MongoDB.
 * Qué hace: Rechaza con 400 los IDs mal formados antes de llegar a Mongoose.
 * Cómo lo hace: Usa isValidObjectId() de mongoose y lanza BadRequestException si falla.
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isValidObjectId(value)) {
      throw new BadRequestException('El ID proporcionado no es válido');
    }
    return value;
  }
}