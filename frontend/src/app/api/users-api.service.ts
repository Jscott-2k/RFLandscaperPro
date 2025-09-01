import { Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiService } from '../api.service';

export type User = {
  company?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  email: string;
  firstName?: string;
  id: number;
  lastName?: string;
  phone?: string;
  role: string;
  username: string;
};

export type CreateUser = {
  username: string;
  email: string;
  password: string;
  role?: string;
  company?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type UpdateUser = Partial<Omit<CreateUser, 'role' | 'company'>>;

@Injectable({ providedIn: 'root' })
export class UsersApiService extends ApiService {
  getUsers(): Observable<User[]> {
    return this.request<User[]>('GET', `${environment.apiUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.request<User>('GET', `${environment.apiUrl}/users/${id}`);
  }

  createUser(payload: CreateUser): Observable<User> {
    return this.request<User>('POST', `${environment.apiUrl}/users`, { body: payload });
  }

  updateUser(id: number, payload: UpdateUser): Observable<User> {
    return this.request<User>('PATCH', `${environment.apiUrl}/users/${id}`, { body: payload });
  }

  deleteUser(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/users/${id}`);
  }

  getMe(): Observable<User> {
    return this.request<User>('GET', `${environment.apiUrl}/users/me`);
  }

  updateMe(payload: UpdateUser): Observable<User> {
    return this.request<User>('PUT', `${environment.apiUrl}/users/me`, { body: payload });
  }
}
