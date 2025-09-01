import { Injectable, inject } from '@angular/core';

import { LoggerService } from './logger.service';
import { ToasterService } from './toaster.service';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly notifier = inject(ToasterService);
  private readonly logger = inject(LoggerService);

  show(message: string): void {
    this.logger.error(message);
    this.notifier.show(message);
  }
}
