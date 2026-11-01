// Importamos el decorador Injectable y las excepciones HTTP de NestJS
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
// Importamos el servicio de usuarios para interactuar con la colección en MongoDB
import { UsuariosService } from '../usuarios/usuarios.service.js';
// Importamos el DTO de creación de usuario
import { CreateUsuarioDto } from '../usuarios/dto/create-usuario.dto.js';
// Importamos el DTO de login
import { LoginDto } from './dto/login.dto.js';
// Importamos bcrypt para la comparación y encriptación de contraseñas
import * as bcrypt from 'bcrypt';
// Importamos CloudinaryService para el manejo de fotos de perfil
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
// Importamos JwtService para la firma, decodificación y verificación de tokens
import { JwtService } from '@nestjs/jwt';

/**
 * Servicio encargado de la lógica criptográfica, creación de sesiones y emisión de JWT.
 */
@Injectable()
export class AuthService {
  // Inyectamos las dependencias requeridas en el constructor
  constructor(
    private usuariosService: UsuariosService,
    private cloudinaryService: CloudinaryService,
    private jwtService: JwtService,
  ) {}

  /**
   * Método privado auxiliar que empaqueta el payload seguro y genera el token firmado.
   */
  private generarToken(usuario: any): string {
    // Definimos la carga útil (payload) del JWT sin datos sensibles
    const payload = {
      id: usuario._id,
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    };
    // Firmamos el payload con la clave secreta y expiración a 15 minutos
    return this.jwtService.sign(payload);
  }

  /**
   * Registra un nuevo usuario verificando unicidad previa y encriptando su clave.
   */
  async registro(dto: CreateUsuarioDto, imagenUrl?: string) {
    // Comprobamos si el correo o el alias de usuario ya existen en la base de datos
    const credencialesExisten = await this.usuariosService.findByCorreoONombreUsuario(
      dto.correo,
      dto.nombreUsuario,
    );
    // Si ya existe coincidencia, cancelamos la creación lanzando error 409 Conflict
    if (credencialesExisten) {
      throw new ConflictException('El correo o nombre de usuario ya están registrados');
    }

    // Extraemos la contraseña y descartamos el campo repetirPassword
    const { repetirPassword, password, ...datosUsuario } = dto;

    // Generamos una sal aleatoria con costo 10
    const salt = await bcrypt.genSalt(10);
    // Encriptamos la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Ensamblamos el objeto listo para persistirse en la base de datos
    const usuarioPorCrear = {
      ...datosUsuario,
      password: hashedPassword,
      imagen: imagenUrl,
      perfil: 'usuario',
      activo: true,
    };

    // Creamos el documento en MongoDB mediante el repositorio de usuarios
    const usuario = await this.usuariosService.create({ ...usuarioPorCrear });
    // Sanitizamos el resultado para remover el hash de la contraseña
    const usuarioSanitizado = this.usuariosService.sanitizarUsuario(usuario);

    // Emitimos el token JWT inicial para la sesión
    const token = this.generarToken(usuarioSanitizado);

    // Retornamos el token firmado junto con los datos públicos del usuario
    return { token, usuario: usuarioSanitizado };
  }

  /**
   * Valida credenciales, comprueba que la cuenta no esté bloqueada y firma un nuevo JWT.
   */
  async login(loginDto: LoginDto) {
    // Desestructuramos la credencial (correo o alias) y la contraseña ingresada
    const { credencial, password } = loginDto;

    // Buscamos el usuario en MongoDB trayendo el campo oculto password
    const usuario = await this.usuariosService.findByCorreoONombreUsuario(credencial);

    // Si el usuario no existe en la base de datos, rechazamos el login
    if (!usuario) {
      throw new ConflictException('Credenciales inválidas');
    }

    // Si la cuenta tiene una baja lógica activa (activo = false), notificamos el bloqueo
    if (!usuario.activo) {
      throw new ConflictException('Esta cuenta esta bloqueada');
    }

    // Comparamos la contraseña en texto plano contra el hash almacenado usando bcrypt
    const passwordValida = await bcrypt.compare(password, usuario.password);
    // Si no coinciden los hashes, rechazamos la autenticación
    if (!passwordValida) {
      throw new ConflictException('Credenciales inválidas');
    }

    // Sanitizamos los datos del usuario logueado
    const usuarioSanitizado = this.usuariosService.sanitizarUsuario(usuario);
    // Emitimos el nuevo token JWT para la sesión
    const token = this.generarToken(usuarioSanitizado);

    // Devolvemos el token firmado junto al usuario
    return { token, usuario: usuarioSanitizado };
  }

  /**
   * Verifica la validez criptográfica y expiración de una cadena JWT recibida.
   */
  verificarToken(token: string) {
    try {
      // Intenta decodificar y validar la firma con la clave secreta
      return this.jwtService.verify(token);
    } catch (error) {
      // Si la firma es incorrecta o expiró el plazo de 15 minutos, lanza 401
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Busca un usuario por su identificador asegurando que permanezca activo en el sistema.
   */
  async buscarPorId(id: string) {
    // Consultamos al repositorio de usuarios
    const usuario = await this.usuariosService.findOne(id);
    // Si no se encuentra el documento, denegamos el acceso
    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');
    // Si el usuario fue dado de baja recientemente, rechazamos la autorización
    if (!(usuario as any).activo) throw new UnauthorizedException('Cuenta desactivada');

    // Devolvemos el usuario activo
    return usuario;
  }

  /**
   * Renueva la sesión emitiendo un nuevo token por otros 15 minutos.
   */
  async refrescar(tokenViejo: string) {
    try {
      // Verificamos que el token recibido siga siendo válido
      const payload = this.verificarToken(tokenViejo);
      // Validamos que la cuenta continúe existiendo y habilitada
      const usuario = await this.buscarPorId(payload.id);
      // Emitimos un nuevo token con otros 15 minutos de vigencia
      return this.generarToken(usuario);
    } catch (error) {
      // Si el token es inválido o no existe la cuenta, denegamos la renovación
      throw new UnauthorizedException('Sesión desconocida o expirada');
    }
  }
}