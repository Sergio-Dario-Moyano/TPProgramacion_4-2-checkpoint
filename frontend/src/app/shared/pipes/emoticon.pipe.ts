// Importamos utilidades para pipes de Angular
import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe personalizada que transforma atajos de texto habituales en emojis nativos.
 */
@Pipe({
  name: 'emoticon',
  standalone: true
})
export class EmoticonPipe implements PipeTransform {
  /**
   * Recorre un diccionario de expresiones regulares y reemplaza las coincidencias.
   */
  transform(texto: string | null | undefined): string {
    // Si el texto está vacío o indefinido, devolvemos una cadena vacía
    if (!texto) return '';

    // Mapa de shortcodes asociados a sus correspondientes emojis Unicode
    const mapaEmojis: Record<string, string> = {
      ':smile:': '😄',
      ':\\)': '😊',
      ':D': '😁',
      '<3': '❤️',
      ':fire:': '🔥',
      ':star:': '⭐',
      ':sad:': '😢',
      ':\\(': '😞',
      'xD': '😆',
      'XD': '😆'
    };

    // Variable que almacenará el texto modificado
    let textoTransformado = texto;

    // Iteramos sobre cada clave del diccionario
    for (const clave in mapaEmojis) {
      // Creamos una expresión regular insensible a mayúsculas/minúsculas y global
      const regex = new RegExp(clave, 'gi');
      // Reemplazamos todas las apariciones del shortcode por el emoji
      textoTransformado = textoTransformado.replace(regex, mapaEmojis[clave]);
    }

    // Devolvemos el texto procesado
    return textoTransformado;
  }
}
