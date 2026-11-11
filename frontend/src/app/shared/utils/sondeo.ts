import { DestroyRef } from '@angular/core';

/**
 * Actualización periódica ("tiempo real" por sondeo).
 * Qué hace: Ejecuta `accion` cada `intervaloMs` mientras la pestaña está visible, y una vez más
 * apenas el usuario vuelve a la pestaña. Se detiene sola cuando se destruye el componente.
 * Por qué sondeo y no WebSockets: funciona igual en Render (plan gratuito) y en Vercel sin
 * configurar nada extra, y la API sigue siendo REST con los status de la consigna.
 */
export function iniciarSondeo(accion: () => void, intervaloMs: number, destroyRef: DestroyRef): void {
  const visible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

  const id = setInterval(() => {
    if (visible()) accion();
  }, intervaloMs);

  const alVolver = () => {
    if (visible()) accion();
  };
  document.addEventListener('visibilitychange', alVolver);

  destroyRef.onDestroy(() => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', alVolver);
  });
}
