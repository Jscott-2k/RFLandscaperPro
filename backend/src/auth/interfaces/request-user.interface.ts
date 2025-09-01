import { type UserRole } from '../../users/user.entity';

export type RequestUser = {
  companyId?: number | null;
  id: number;
  role: UserRole;
}
