import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Company = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { companyId?: number } }>();
    return request.user?.companyId;
  },
);
