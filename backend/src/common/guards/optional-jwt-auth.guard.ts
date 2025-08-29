import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestUser } from '../../auth/interfaces/request-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  handleRequest<TUser extends RequestUser = RequestUser>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    try {
      return super.handleRequest(err, user, info, context);
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        return null as unknown as TUser;
      }
      throw e;
    }
  }
}
