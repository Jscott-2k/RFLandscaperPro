import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../auth/auth.service';
import { CompanySwitcherComponent } from '../company-switcher/company-switcher.component';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, CompanySwitcherComponent],
  selector: 'app-layout',
  standalone: true,
  styleUrl: './layout.component.scss',
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout().subscribe();
  }
}
