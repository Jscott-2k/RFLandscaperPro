import { type UserRole } from '../../users/user.entity';

export type JwtUserPayload = {
  companyId?: number | null;
  email: string;
  role?: UserRole;
  roles?: UserRole[];
  userId: number;
  username: string;
}
