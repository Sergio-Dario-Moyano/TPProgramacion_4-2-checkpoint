import { Controller, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { AppService } from './app.service.js';

// @ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint raíz de comprobación de salud (Health Check).
   * Qué hace: Confirma que la aplicación NestJS está levantada y respondiendo peticiones HTTP.
   * Cómo lo hace: Mapea la ruta raíz '/' mediante el decorador @Get() y delega la respuesta a AppService.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  getHello(): string {
    return this.appService.getHello();
  }
}















// import { Controller, Get } from '@nestjs/common';
// import { AppService } from './app.service.js';

// @Controller()
// export class AppController {
//   constructor(private readonly appService: AppService) {}

//   @Get()
//   getHello(): string {
//     return this.appService.getHello();
//   }
// }
