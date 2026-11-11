import { DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { debounceTime, merge, tap } from 'rxjs';

export type EstadoCoincidencia = 'vacio' | 'escribiendo' | 'coinciden' | 'no-coinciden';

/**
 * Verifica que "repetir contraseña" coincida, pero recién cuando el usuario terminó de escribir.
 * Mientras tipea, el estado es "escribiendo" (no se muestra ni "coinciden" ni "no coinciden").
 * Se considera que terminó cuando pasan `demoraMs` sin cambios o cuando sale del campo (blur).
 */
export function crearVerificadorCoincidencia(
  password: AbstractControl,
  repetir: AbstractControl,
  destroyRef: DestroyRef,
  demoraMs = 900
) {
  const estado = signal<EstadoCoincidencia>('vacio');

  const evaluar = (): void => {
    const valorRepetido = (repetir.value ?? '') as string;
    if (!valorRepetido) {
      estado.set('vacio');
      return;
    }
    estado.set(valorRepetido === password.value ? 'coinciden' : 'no-coinciden');
  };

  merge(password.valueChanges, repetir.valueChanges)
    .pipe(
      tap(() => estado.set(repetir.value ? 'escribiendo' : 'vacio')),
      debounceTime(demoraMs),
      takeUntilDestroyed(destroyRef)
    )
    .subscribe(() => evaluar());

  return {
    estado,
    /** Evalúa en el momento (al salir del campo o al enviar el formulario). */
    confirmarAhora: evaluar,
    reiniciar: () => estado.set('vacio')
  };
}
