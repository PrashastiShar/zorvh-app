// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // Used to read metadata
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from '../../user/user.entity'; // Import UserRole enum
import { ROLES_KEY } from '../decorators/roles.decorator'; // Import the ROLES_KEY constant

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from the @Roles() decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(), // Check method metadata
      context.getClass(),   // Check class metadata
    ]);

    // If no roles are specified for this handler, then it's public (no role restriction)
    if (!requiredRoles) {
      return true;
    }

    // 2. Get the authenticated user from the GraphQL context
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user = request.user; // User object attached by GqlAuthGuard/JwtStrategy

    // If no user is found (should be caught by GqlAuthGuard before this)
    if (!user) {
      return false; // Or throw an UnauthorizedException if you prefer
    }

    // 3. Check if the user's role matches any of the required roles
    // The 'includes' method works because requiredRoles is an array
    // user.role is the specific role of the authenticated user
    return requiredRoles.includes(user.role);
  }
}