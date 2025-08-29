import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  show(message: string): void {
    // Display the error to the user; replace alert with snackbar if available
    console.error(message);
    if (typeof window !== 'undefined') {
      window.alert(message);
    }
  }
}
