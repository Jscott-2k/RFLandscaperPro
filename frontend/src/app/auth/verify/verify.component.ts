import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
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
        next: () => (this.message = 'Email verified. You can now login.'),
        error: () => (this.message = 'Verification failed.'),
      });
    } else {
      this.message = 'No token provided.';
    }
  }
}
