import { UserRole } from '../../users/user.entity';

export interface JwtUserPayload {
  userId: number;
  username: string;
  email: string;
  roles?: UserRole[];
  role?: UserRole;
  companyId?: number | null;
}
