import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest(err: unknown, user: any, info: unknown, context: ExecutionContext) {
    try {
      return super.handleRequest(err, user, info, context);
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return null;
      }
      throw e;
    }
  }
}
