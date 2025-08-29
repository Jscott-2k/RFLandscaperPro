import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { InvitationsService, InvitationPreview } from './invitations.service';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <ng-container *ngIf="loading">Loading...</ng-container>
    <ng-container *ngIf="!loading && preview">
      <div *ngIf="preview.status !== 'valid'">
        <p>Invitation {{ preview.status }}</p>
      </div>
      <div *ngIf="preview.status === 'valid'">
        <p>
          You have been invited to {{ preview.companyName }} as {{ preview.role }} using
          {{ preview.email }}
        </p>
        <div *ngIf="mode === 'login'">
          <form [formGroup]="loginForm" (ngSubmit)="login()">
            <input type="email" formControlName="email" placeholder="Email" />
            <input type="password" formControlName="password" placeholder="Password" />
            <button type="submit" [disabled]="loginLoading">Login</button>
          </form>
          <button type="button" (click)="mode = 'create'">Create account</button>
        </div>
        <div *ngIf="mode === 'create'">
          <form [formGroup]="createForm" (ngSubmit)="create()">
            <input type="text" formControlName="name" placeholder="Name" />
            <input type="password" formControlName="password" placeholder="Password" />
            <button type="submit" [disabled]="createLoading">Create Account</button>
          </form>
          <button type="button" (click)="mode = 'login'">I have an account</button>
        </div>
      </div>
    </ng-container>
  `,
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invitations = inject(InvitationsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private errorService = inject(ErrorService);

  preview?: InvitationPreview;
  loading = true;
  token = '';
  mode: 'login' | 'create' = 'login';

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    password: ['', Validators.required.bind(Validators)],
  });

  createForm = this.fb.nonNullable.group({
    name: ['', Validators.required.bind(Validators)],
    password: ['', Validators.required.bind(Validators)],
  });

  loginLoading = false;
  createLoading = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (this.token) {
      this.invitations
        .preview(this.token)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            this.preview = res;
            if (res.status === 'valid') {
              this.loginForm.patchValue({ email: res.email });
            }
          },
          error: (err: unknown) => {
            this.errorService.show((err as Error).message);
          },
        });
    } else {
      this.loading = false;
      this.errorService.show('Invalid invitation token');
    }
  }

  login(): void {
    if (this.loginForm.valid && !this.loginLoading) {
      this.loginLoading = true;
      this.auth
        .login(this.loginForm.getRawValue())
        .pipe(
          switchMap(() => this.invitations.accept(this.token)),
          finalize(() => (this.loginLoading = false)),
        )
        .subscribe({
          next: (res) => {
            this.auth.handleAuth(res);
            void this.router.navigate(['/dashboard']);
          },
          error: (err: unknown) => this.errorService.show((err as Error).message),
        });
    }
  }

  create(): void {
    if (this.createForm.valid && !this.createLoading) {
      this.createLoading = true;
      this.invitations
        .accept(this.token, this.createForm.getRawValue())
        .pipe(finalize(() => (this.createLoading = false)))
        .subscribe({
          next: (res) => {
            this.auth.handleAuth(res);
            void this.router.navigate(['/dashboard']);
          },
          error: (err: unknown) => this.errorService.show((err as Error).message),
        });
    }
  }
}
