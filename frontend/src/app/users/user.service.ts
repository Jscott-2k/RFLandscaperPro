import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '../companies/company.model';
import { ApiService } from '../api.service';

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
  private readonly api = inject(ApiService);

  getUsers(): Observable<User[]> {
    return this.api.getUsers();
  }

  getUser(id: number): Observable<User> {
    return this.api.getUser(id) as Observable<User>;
  }

  createUser(user: Partial<User>): Observable<User> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.createUser(user as any) as Observable<User>;
  }

  updateUser(user: User): Observable<User> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.updateUser(user.id, user as any) as Observable<User>;
  }

  deleteUser(id: number): Observable<void> {
    return this.api.deleteUser(id);
  }
}
