import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    console.log('role-guard- requiresrole:', requiredRoles);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    console.log('role-guard- user:', user);
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission (role) to access this resource',
      );
    }

    return true;
  }
}
