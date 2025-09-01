import {
  type Customer as ApiCustomer,
  type CreateCustomer as ApiCreateCustomer,
  type UpdateCustomer as ApiUpdateCustomer,
} from '../api/customers-api.service';

export type Customer = ApiCustomer;
export type CreateCustomer = ApiCreateCustomer;
export type UpdateCustomer = ApiUpdateCustomer;
