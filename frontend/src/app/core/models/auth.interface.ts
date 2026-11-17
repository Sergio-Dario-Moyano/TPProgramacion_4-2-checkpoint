export type RolUsuario = 'usuario' | 'administrador';

export interface ILogin {
  credencial: string;
  password: string;
}

export interface IUsuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: Date | string;
  descripcion: string;
  imagen: string;
  perfil: RolUsuario;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** Respuesta de registro, login y refrescar. */
export interface IRespuestaSesion {
  message: string;
  token: string;
  expiraEn: number;
  usuario: IUsuario;
}

/** Respuesta de autorizar (no trae token nuevo). */
export interface IRespuestaAutorizar {
  message: string;
  expiraEn: number;
  usuario: IUsuario;
}















