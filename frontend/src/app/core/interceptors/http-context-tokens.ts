import { HttpContextToken } from '@angular/common/http';

/**
 * Token de contexto para excluir solicitudes específicas del interceptor global.
 */
export const SKIP_INTERCEPTOR = new HttpContextToken<boolean>(() => false);


