import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(message: string): void {
    if (typeof console !== 'undefined') {
      console.error(message);
    }
  }
}
