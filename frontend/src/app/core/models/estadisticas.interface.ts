export interface IRespuestaEstadistica<T> {
  desde: string;
  hasta: string;
  total: number;
  datos: T[];
}

export interface IPublicacionesPorUsuario {
  usuarioId: string;
  nombreUsuario: string;
  nombre: string;
  cantidad: number;
}

export interface IComentariosPorDia {
  fecha: string;
  cantidad: number;
}

export interface IComentariosPorPublicacion {
  publicacionId: string;
  titulo: string;
  activa: boolean;
  cantidad: number;
}
