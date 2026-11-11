import { HttpContextToken } from '@angular/common/http';

/**
 * Token de contexto para excluir solicitudes específicas del interceptor global.
 */
export const SKIP_INTERCEPTOR = new HttpContextToken<boolean>(() => false);










// // Importamos la clase HttpContextToken desde el módulo HTTP de Angular
// import { HttpContextToken } from '@angular/common/http';

// /**
//  * Token de contexto HTTP utilizado para marcar solicitudes que no deben ser
//  * interrumpidas por el interceptor global ante un código de estado 401.
//  * Por defecto tiene el valor false.
//  */
// export const SKIP_INTERCEPTOR = new HttpContextToken<boolean>(() => false);
