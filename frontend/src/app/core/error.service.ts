import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  notify(message: string): void {
    alert(message);
  }
}
