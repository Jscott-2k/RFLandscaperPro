import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // In a real app roles would come from the authenticated user
  private readonly roles = signal<string[]>(['admin']);

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
}
