export enum CompanyUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

export interface CompanyMembership {
  companyId: number;
  companyName: string;
  role: CompanyUserRole;
}
