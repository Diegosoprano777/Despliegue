import { Component } from '@angular/core';

@Component({
  selector: 'app-tarjeta',
  standalone: true, // 🔥 ESTO SOLUCIONA TODO
  template: `
    <div class="tarjeta">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./tarjeta.css']
})
export class TarjetaComponent {}