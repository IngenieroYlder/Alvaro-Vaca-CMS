import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RolesService } from '../roles/roles.service'; // Added
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AutenticacionService {
  constructor(
    private usuariosService: UsuariosService,
    private rolesService: RolesService, // Injected
    private jwtService: JwtService,
  ) { }

  async validarUsuario(email: string, contrasena: string): Promise<any> {
    // ... existing validation logic ...
    const usuario = await this.usuariosService.buscarParaAuth(email);

    if (!usuario) {
      return null;
    }

    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);

    if (usuario && isMatch) {
      const { contrasena, ...resultado } = usuario;
      return resultado;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const usuario = await this.validarUsuario(
      loginDto.email,
      loginDto.contrasena,
    );
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Resolve Permissions
    let permisos: string[] = [];
    if (usuario.roles && usuario.roles.length > 0) {
      // Normalize roles to avoid case/whitespace issues
      const normalizedRoles = usuario.roles.map((r: string) => String(r).toLowerCase().trim());

      const rolesEntities = await Promise.all(
        normalizedRoles.map((roleName: string) => this.rolesService.findByName(roleName))
      );

      // Flatten permissions and remove duplicates
      const allPermisos = rolesEntities
        .filter(r => r) // Filter out nulls if role not found
        .flatMap(r => r.permisos || []) // Safety: ensure array
        .concat(normalizedRoles.includes('god') ? ['god'] : []); // Keep 'god' logic if needed

      permisos = [...new Set(allPermisos)];
    }

    const payload = {
      email: usuario.email,
      sub: usuario.id,
      roles: usuario.roles,
      permisos: permisos, // Add to token payload
    };

    try {
      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
        usuario: {
          ...usuario,
          permisos: permisos // Add to user response
        },
      };
    } catch (error) {
      console.error('[AUTH DEBUG] Error generando token JWT:', error);
      throw error;
    }
  }

  async registrarCandidato(datos: any) {
    // 1. Create User with role 'candidato'
    const nuevoUsuario = await this.usuariosService.crear({
      ...datos,
      contrasena: datos.password, // Mapping form field 'password' to 'contrasena'
      roles: ['candidato']
    });

    // 2. Generate Token for auto-login
    const payload = {
      email: nuevoUsuario.email,
      sub: nuevoUsuario.id,
      roles: nuevoUsuario.roles,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      usuario: nuevoUsuario
    };
  }

  decodificarToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
