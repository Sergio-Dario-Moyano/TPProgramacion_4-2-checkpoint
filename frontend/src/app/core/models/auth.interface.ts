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















// /**
//  * Interfaz para las credenciales de inicio de sesión.
//  * Permite ingresar por correo electrónico o por nombre de usuario.
//  */
// export interface ILogin {
//   // Credencial única del usuario (email o handle de usuario)
//   credencial: string;
//   // Contraseña en texto plano antes de enviarse al backend
//   password: string;
// }

// /**
//  * Interfaz para el registro de una cuenta de usuario nueva.
//  * Contiene todas las validaciones exigidas por el Sprint 1.
//  */
// export interface IRegistroUsuario {
//   // Nombre real de la persona
//   nombre: string;
//   // Apellido real de la persona
//   apellido: string;
//   // Correo electrónico institucional o personal válido
//   correo: string;
//   // Nombre de usuario único (handle público)
//   nombreUsuario: string;
//   // Contraseña con requerimiento de 8 caracteres, 1 mayúscula y 1 número
//   password: string;
//   // Repetición obligatoria para confirmación de contraseña
//   repetirPassword?: string;
//   // Fecha de nacimiento en formato de texto YYYY-MM-DD
//   fechaNacimiento: string;
//   // Biografía o breve descripción sobre el estudiante
//   descripcion?: string;
//   // Rol en el sistema: usuario regular o administrador
//   perfil?: 'usuario' | 'administrador';
//   // URL de imagen en Cloudinary en caso de recibirse como texto
//   imagen?: string;
// }

// /**
//  * Interfaz completa de Usuario devuelta por el servidor sin exponer contraseñas.
//  */
// export interface IUsuario {
//   // Identificador único de MongoDB
//   _id: string;
//   // Nombre del usuario
//   nombre: string;
//   // Apellido del usuario
//   apellido: string;
//   // Correo electrónico registrado
//   correo: string;
//   // Nombre de usuario público sin espacios
//   nombreUsuario: string;
//   // Fecha de nacimiento procesable como Date o string
//   fechaNacimiento: Date | string;
//   // Descripción o bio del perfil
//   descripcion: string;
//   // Enlace seguro de la foto de perfil en Cloudinary
//   imagen: string;
//   // Perfil de permisos del sistema
//   perfil: 'usuario' | 'administrador';
//   // Estado para la baja lógica (true = activo, false = deshabilitado)
//   activo: boolean;
//   // Marca de tiempo de creación del registro
//   createdAt: string;
// }
