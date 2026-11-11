import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Mensaje de prueba raíz del servidor.
   * Qué hace: Devuelve un saludo de confirmación de operatividad.
   * Cómo lo hace: Retorna una cadena de texto simple sincrónica.
   */
  getHello(): string {
    return 'Checkpoint API en funcionamiento';
  }
}










// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class AppService {
//   getHello(): string {
//     return 'Hello World!';
//   }
// }
