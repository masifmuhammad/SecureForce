// ============================================================
// @CurrentTenant Decorator — Extracts tenantId from request
// ============================================================
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_TENANT_KEY } from '../../../common/constants';

export const CurrentTenant = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request[REQUEST_TENANT_KEY] || request.user?.tenantId;
    },
);
