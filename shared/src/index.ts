export enum CompanyUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WORKER = 'WORKER',
}

export type CompanyMembership = {
  companyId: number;
  companyName: string;
  role: CompanyUserRole;
}
