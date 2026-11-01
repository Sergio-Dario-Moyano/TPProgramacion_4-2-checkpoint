// Importamos la excepción para errores de solicitud inválida
import { BadRequestException } from '@nestjs/common';
// Importamos memoryStorage para retener temporalmente los archivos en el Buffer de memoria
import { memoryStorage } from 'multer';

// Tipos MIME de imágenes permitidos
const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

// Límite máximo de tamaño en bytes: 5 MB (5 * 1024 * 1024)
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * Configuración centralizada de Multer para la intercepción de archivos en controladores.
 */
export const multerConfig = {
  // Almacenamos el archivo en memoria en lugar de escribirlo en disco local
  storage: memoryStorage(),
  limits: {
    // Restricción estricta de peso
    fileSize: TAMANO_MAXIMO_BYTES,
  },
  // Filtro de validación sobre el tipo MIME del archivo recibido
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // Si el archivo no coincide con los formatos admitidos, lanzamos una excepción
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Tipo de archivo no permitido: ${file.mimetype}. Formatos aceptados: jpg, png, webp`,
        ),
        false,
      );
    }
    // Aceptamos el archivo
    callback(null, true);
  },
};