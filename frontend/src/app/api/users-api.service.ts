import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

export type CreateUser = Partial<Omit<User, 'id'>>;
export type UpdateUser = Partial<CreateUser>;

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
