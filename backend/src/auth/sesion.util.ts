import type { Request, Response } from 'express';

/** Nombre de la cookie donde viaja el JWT. */
export const NOMBRE_COOKIE = 'autorizacion';

/**
 * Extrae el JWT de la petición.
 * Qué hace: Busca el token primero en el header Authorization (Bearer) y, si no está, en la cookie.
 * Cómo lo hace: Lee request.headers.authorization y request.cookies['autorizacion'].
 * El header permite que la app funcione aunque el navegador bloquee cookies de terceros.
 */
export function extraerToken(request: Request): string | null {
  const header = request.headers?.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const cookie = request.cookies ? request.cookies[NOMBRE_COOKIE] : null;
  return cookie || null;
}

/**
 * Guarda el token en una cookie HttpOnly con el mismo vencimiento que el JWT.
 * Qué hace: Deja la sesión en el navegador además de devolver el token en el body.
 * Cómo lo hace: response.cookie con httpOnly, sameSite none y secure (front y back en dominios distintos).
 */
export function setearCookieSesion(response: Response, token: string, minutos: number): void {
  response.cookie(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    expires: new Date(Date.now() + 1000 * 60 * minutos),
  });
}

/**
 * Borra la cookie de sesión.
 * Qué hace: Invalida la sesión del lado del navegador al cerrar sesión.
 * Cómo lo hace: Reescribe la cookie vacía con fecha de expiración en el pasado.
 */
export function borrarCookieSesion(response: Response): void {
  response.cookie(NOMBRE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    expires: new Date(0),
  });
}