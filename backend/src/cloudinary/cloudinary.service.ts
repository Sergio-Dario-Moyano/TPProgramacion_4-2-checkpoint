// Importamos el decorador Injectable y las excepciones HTTP de NestJS
import { Injectable, BadRequestException } from '@nestjs/common';
// Importamos los tipos del SDK de Cloudinary
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
// Importamos Readable de Node.js para convertir el Buffer en un stream de lectura
import { Readable } from 'stream';

/**
 * Servicio encargado de la comunicación por stream hacia los servidores de Cloudinary.
 */
@Injectable()
export class CloudinaryService {
  /**
   * Sube una imagen mediante streaming directo a la carpeta indicada.
   */
  async subirImagen(
    archivo: Express.Multer.File,
    carpeta: string = 'fotos_perfil',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Creamos el stream de subida hacia Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Carpeta destino dentro de Cloudinary (fotos_perfil o publicaciones)
          folder: carpeta,
          // Extensiones permitidas en el servidor remoto
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          // Transformaciones de optimización automática
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' },
          ],
        },
        // Callback que resuelve o rechaza la promesa
        (error, resultado) => {
          if (error) {
            return reject(
              new BadRequestException(
                `Error al subir imagen a Cloudinary: ${error?.message ?? 'resultado vacío'}`,
              ),
            );
          }
          // Devolvemos el resultado con secure_url y metadatos
          return resolve(resultado as UploadApiResponse);
        },
      );

      // Creamos un stream legible en memoria a partir del Buffer del archivo
      const readable = new Readable();
      (readable as any)._read = () => {};
      // Insertamos el buffer en el stream
      readable.push(archivo.buffer);
      // Finalizamos el stream
      readable.push(null);
      // Conectamos el stream de lectura con el stream de subida de Cloudinary
      readable.pipe(uploadStream);
    });
  }

  /**
   * Elimina una imagen alojada en Cloudinary a partir de su public_id.
   */
  async eliminarImagen(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}