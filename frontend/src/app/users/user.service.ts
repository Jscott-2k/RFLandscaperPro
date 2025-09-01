import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';

import { UsersApiService } from '../api/users-api.service';
import { type User, type CreateUser, type UpdateUser } from './user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = inject(UsersApiService);

  getUsers(): Observable<User[]> {
    return this.api.getUsers();
  }

  getUser(id: number): Observable<User> {
    return this.api.getUser(id);
  }

  createUser(user: CreateUser): Observable<User> {
    return this.api.createUser(user);
  }

  updateUser(user: UpdateUser & { id: number }): Observable<User> {
    const { id, ...payload } = user;
    return this.api.updateUser(id, payload);
  }

  deleteUser(id: number): Observable<void> {
    return this.api.deleteUser(id);
  }
}
