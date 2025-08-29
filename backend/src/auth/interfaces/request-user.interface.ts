import { UserRole } from '../../users/user.entity';

export interface RequestUser {
  id: number;
  companyId?: number | null;
  role: UserRole;
}

