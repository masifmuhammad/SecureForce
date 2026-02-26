// ============================================================
// Common: Role-based access guard
// Restricts endpoints to specific user roles
// ============================================================
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities';

export const ROLES_KEY = 'roles';

// Decorator to set required roles on a route
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) return true; // No roles required = public

        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.includes(user.role);
    }
}
