import { Injectable } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { type UserRole } from '../users/user.entity';

type JwtPayload = {
  companyId: number | null;
  email: string;
  role?: UserRole;
  roles: UserRole[];
  sub: number;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return {
      companyId: payload.companyId,
      email: payload.email,
      role: payload.role ?? payload.roles?.[0],
      roles: payload.roles,
      userId: payload.sub,
      username: payload.username,
    };
  }
}
