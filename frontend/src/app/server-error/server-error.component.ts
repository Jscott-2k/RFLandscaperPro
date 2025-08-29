import { Component } from '@angular/core';

@Component({
  selector: 'app-server-error',
  standalone: true,
  template: `
    <div class="server-error">
      <h1>RF Landscaper Pro</h1>
      <p>is undergoing difficulties. Please try again later.</p>
    </div>
  `,
})
export class ServerErrorComponent {}
