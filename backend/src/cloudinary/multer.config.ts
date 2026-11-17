import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const multerConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: TAMANO_MAXIMO_BYTES,
  },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Formato inválido: ${file.mimetype}. Formatos permitidos: JPG, PNG, WEBP.`,
        ),
        false,
      );
    }
    callback(null, true);
  },
};

















