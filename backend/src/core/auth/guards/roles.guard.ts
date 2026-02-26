// ============================================================
// Roles Guard — Enforces role-based access on protected routes
// Use with @Roles(UserRole.ADMIN) decorator on controllers
// ============================================================
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles required → allow access
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) return false;

        return requiredRoles.includes(user.role);
    }
}
