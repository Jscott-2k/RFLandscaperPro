import {
  type User as ApiUser,
  type CreateUser as ApiCreateUser,
  type UpdateUser as ApiUpdateUser,
} from '../api/users-api.service';

export type User = ApiUser;
export type CreateUser = ApiCreateUser;
export type UpdateUser = ApiUpdateUser;
