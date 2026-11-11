import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
import { RolUsuario } from '../usuarios/schemas/usuario.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { firmarToken, vencimientoToken } from './token.util.js';

/** Respuesta común de registro, login, autorizar y refrescar. */
export interface SesionRespuesta {
  token: string;
  expiraEn: number;
  usuario: any;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Arma la sesión de un usuario.
   * Qué hace: Firma el token y calcula su vencimiento.
   * Cómo lo hace: Usa las utilidades compartidas firmarToken() y vencimientoToken().
   */
  private armarSesion(usuario: any): SesionRespuesta {
    const token = firmarToken(this.jwtService, usuario);
    return { token, expiraEn: vencimientoToken(this.jwtService, token), usuario };
  }

  /**
   * Registro (Sprint 1 y 3).
   * Qué hace: Crea el usuario con perfil "usuario" (valida unicidad, encripta contraseña, sube foto) y abre sesión.
   * Cómo lo hace: Delegación en usuariosService.crearUsuario() y firma del JWT.
   */
  async registro(dto: CreateUsuarioDto, file?: Express.Multer.File): Promise<SesionRespuesta> {
    // El registro público siempre crea perfil "usuario", aunque se envíe otro valor.
    // Solo un administrador puede crear administradores o cambiar el rol (dashboard).
    const usuario = await this.usuariosService.crearUsuario({ ...dto, perfil: RolUsuario.USER }, file);
    return this.armarSesion(usuario);
  }

  /**
   * Login (Sprint 1 y 3).
   * Qué hace: Valida credenciales y que la cuenta esté habilitada.
   * Cómo lo hace: Busca por correo o nombre de usuario, compara con bcrypt.compare() y firma el JWT.
   * Devuelve 401 tanto por credenciales inválidas como por cuenta deshabilitada.
   */
  async login(loginDto: LoginDto): Promise<SesionRespuesta> {
    const { credencial, password } = loginDto;
    const usuario = await this.usuariosService.findByCorreoONombreUsuario(credencial.trim());

    if (!usuario) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException(
        'Tu cuenta está deshabilitada. Contactá a un administrador para recuperarla.',
      );
    }

    return this.armarSesion(this.usuariosService.sanitizarUsuario(usuario));
  }

  /**
   * Verifica un token.
   * Qué hace: Comprueba firma y vencimiento.
   * Cómo lo hace: jwtService.verify(); cualquier error se traduce en 401.
   */
  verificarToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Busca el usuario de la sesión garantizando que siga habilitado.
   * Qué hace: Se usa en autorizar y refrescar.
   * Cómo lo hace: usuariosService.findOne(); 401 si no existe o está deshabilitado.
   */
  async buscarUsuarioDeSesion(id: string) {
    const usuario = await this.usuariosService.findOne(id);
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    if (!usuario.activo) throw new UnauthorizedException('Tu cuenta fue deshabilitada');
    return this.usuariosService.sanitizarUsuario(usuario);
  }

  /**
   * Autorizar (Sprint 3).
   * Qué hace: Valida el token y devuelve los datos del usuario y cuándo vence la sesión.
   * Cómo lo hace: verificarToken() + buscarUsuarioDeSesion(). No emite un token nuevo.
   */
  async autorizar(token: string) {
    const payload = this.verificarToken(token);
    const usuario = await this.buscarUsuarioDeSesion(payload.id);
    return { usuario, expiraEn: payload.exp * 1000 };
  }

  /**
   * Refrescar (Sprint 3).
   * Qué hace: Emite un token nuevo con la misma payload y 15 minutos de vigencia.
   * Cómo lo hace: Valida el token actual (debe seguir vigente) y vuelve a firmar con datos actualizados.
   */
  async refrescar(tokenViejo: string): Promise<SesionRespuesta> {
    const payload = this.verificarToken(tokenViejo);
    const usuario = await this.buscarUsuarioDeSesion(payload.id);
    return this.armarSesion(usuario);
  }
}




















// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcryptjs';
// import { UsuariosService } from '../usuarios/usuarios.service.js';
// import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
// import { LoginDto } from './dto/login.dto.js';
// import { firmarToken, vencimientoToken } from './token.util.js';

// /** Respuesta común de registro, login, autorizar y refrescar. */
// export interface SesionRespuesta {
//   token: string;
//   expiraEn: number;
//   usuario: any;
// }

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly usuariosService: UsuariosService,
//     private readonly jwtService: JwtService,
//   ) {}

//   /**
//    * Arma la sesión de un usuario.
//    * Qué hace: Firma el token y calcula su vencimiento.
//    * Cómo lo hace: Usa las utilidades compartidas firmarToken() y vencimientoToken().
//    */
//   private armarSesion(usuario: any): SesionRespuesta {
//     const token = firmarToken(this.jwtService, usuario);
//     return { token, expiraEn: vencimientoToken(this.jwtService, token), usuario };
//   }

//   /**
//    * Registro (Sprint 1 y 3).
//    * Qué hace: Crea el usuario (valida unicidad, encripta contraseña, sube foto) y abre sesión.
//    * Cómo lo hace: Delegación en usuariosService.crearUsuario() y firma del JWT.
//    */
//   async registro(dto: CreateUsuarioDto, file?: Express.Multer.File): Promise<SesionRespuesta> {
//     const usuario = await this.usuariosService.crearUsuario(dto, file);
//     return this.armarSesion(usuario);
//   }

//   /**
//    * Login (Sprint 1 y 3).
//    * Qué hace: Valida credenciales y que la cuenta esté habilitada.
//    * Cómo lo hace: Busca por correo o nombre de usuario, compara con bcrypt.compare() y firma el JWT.
//    * Devuelve 401 tanto por credenciales inválidas como por cuenta deshabilitada.
//    */
//   async login(loginDto: LoginDto): Promise<SesionRespuesta> {
//     const { credencial, password } = loginDto;
//     const usuario = await this.usuariosService.findByCorreoONombreUsuario(credencial.trim());

//     if (!usuario) {
//       throw new UnauthorizedException('Usuario o contraseña incorrectos');
//     }

//     const passwordValida = await bcrypt.compare(password, usuario.password);
//     if (!passwordValida) {
//       throw new UnauthorizedException('Usuario o contraseña incorrectos');
//     }

//     if (!usuario.activo) {
//       throw new UnauthorizedException(
//         'Tu cuenta está deshabilitada. Contactá a un administrador para recuperarla.',
//       );
//     }

//     return this.armarSesion(this.usuariosService.sanitizarUsuario(usuario));
//   }

//   /**
//    * Verifica un token.
//    * Qué hace: Comprueba firma y vencimiento.
//    * Cómo lo hace: jwtService.verify(); cualquier error se traduce en 401.
//    */
//   verificarToken(token: string) {
//     try {
//       return this.jwtService.verify(token);
//     } catch {
//       throw new UnauthorizedException('Token inválido o expirado');
//     }
//   }

//   /**
//    * Busca el usuario de la sesión garantizando que siga habilitado.
//    * Qué hace: Se usa en autorizar y refrescar.
//    * Cómo lo hace: usuariosService.findOne(); 401 si no existe o está deshabilitado.
//    */
//   async buscarUsuarioDeSesion(id: string) {
//     const usuario = await this.usuariosService.findOne(id);
//     if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
//     if (!usuario.activo) throw new UnauthorizedException('Tu cuenta fue deshabilitada');
//     return this.usuariosService.sanitizarUsuario(usuario);
//   }

//   /**
//    * Autorizar (Sprint 3).
//    * Qué hace: Valida el token y devuelve los datos del usuario y cuándo vence la sesión.
//    * Cómo lo hace: verificarToken() + buscarUsuarioDeSesion(). No emite un token nuevo.
//    */
//   async autorizar(token: string) {
//     const payload = this.verificarToken(token);
//     const usuario = await this.buscarUsuarioDeSesion(payload.id);
//     return { usuario, expiraEn: payload.exp * 1000 };
//   }

//   /**
//    * Refrescar (Sprint 3).
//    * Qué hace: Emite un token nuevo con la misma payload y 15 minutos de vigencia.
//    * Cómo lo hace: Valida el token actual (debe seguir vigente) y vuelve a firmar con datos actualizados.
//    */
//   async refrescar(tokenViejo: string): Promise<SesionRespuesta> {
//     const payload = this.verificarToken(tokenViejo);
//     const usuario = await this.buscarUsuarioDeSesion(payload.id);
//     return this.armarSesion(usuario);
//   }
// }

