import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Company {
  name: string;
  address?: string;
  phone?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  company?: Company;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.base, user);
  }

  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.base}/${user.id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
