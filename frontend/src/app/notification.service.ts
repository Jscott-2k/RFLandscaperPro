import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  show(message: string, duration = 3000): void {
    if (typeof document === 'undefined') {
      return;
    }
    const snack = document.createElement('div');
    snack.className = 'app-snackbar';
    snack.textContent = message;
    document.body.appendChild(snack);
    requestAnimationFrame(() => snack.classList.add('show'));
    setTimeout(() => {
      snack.classList.remove('show');
      setTimeout(() => document.body.removeChild(snack), 300);
    }, duration);
  }
}
