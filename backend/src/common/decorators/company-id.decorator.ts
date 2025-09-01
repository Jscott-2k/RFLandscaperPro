import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CompanyId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { companyId?: number };
      headers?: Record<string, string>;
    }>();
    const header = request.headers?.['x-company-id'];
    if (header) {
      const parsed = parseInt(header, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return request.user?.companyId;
  },
);
