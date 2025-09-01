import {
  type Company as ApiCompany,
  type CreateCompany as ApiCreateCompany,
  type UpdateCompany as ApiUpdateCompany,
} from '../api/companies-api.service';

export type Company = ApiCompany;
export type CreateCompany = ApiCreateCompany;
export type UpdateCompany = ApiUpdateCompany;
