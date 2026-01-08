import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!rolesRequeridos) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();

    // Si no hay usuario en request (no pasó por JwtAuthGuard primero)
    if (!user) {
      throw new ForbiddenException('Usuario no identificado');
    }

    // El "God Mode" o admin siempre tiene acceso si así se decide
    if (user.roles?.includes('god') || user.roles?.includes('admin')) {
      return true;
    }

    const tieneRol = rolesRequeridos.some((rol) => user.roles?.includes(rol));
    if (!tieneRol) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción',
      );
    }
    return true;
  }
}
