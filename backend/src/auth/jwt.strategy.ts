import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/user.entity';

interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  roles: UserRole[];
  role?: UserRole;
  companyId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      role: payload.role ?? payload.roles?.[0],
      companyId: payload.companyId,
    };
  }
}
