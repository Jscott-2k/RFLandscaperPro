import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../auth.service';

@Component({
  imports: [CommonModule],
  selector: 'app-verify',
  standalone: true,
  template: ` <p>{{ message }}</p> `,
})
export class VerifyComponent {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  message = 'Verifying...';

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.auth.verifyEmail(token).subscribe({
        error: () => (this.message = 'Verification failed.'),
        next: () => (this.message = 'Email verified. You can now login.'),
      });
    } else {
      this.message = 'No token provided.';
    }
  }
}
