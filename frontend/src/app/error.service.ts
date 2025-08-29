import { Injectable, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly notifier = inject(NotificationService);
  private readonly logger = inject(LoggerService);

  show(message: string): void {
    this.logger.error(message);
    this.notifier.show(message);
  }
}
