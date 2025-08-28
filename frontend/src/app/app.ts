import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  protected readonly backendStatus = signal('checking');
  private readonly api = inject(ApiService);

  ngOnInit(): void {
    this.api.getHealth().subscribe({
      next: () => this.backendStatus.set('online'),
      error: () => this.backendStatus.set('offline')
    });
  }
}
