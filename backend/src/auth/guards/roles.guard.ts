// src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user/user.entity'; // Import your UserRole enum

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are defined on the handler, allow access
    if (!requiredRoles) {
      return true;
    }

    // Get the user from the request (assuming JwtAuthGuard has already attached it)
    const { user } = context.switchToHttp().getRequest();

    // Check if the user exists and has at least one of the required roles
    return user && user.role && requiredRoles.some((role) => user.role === role);
  }
}
