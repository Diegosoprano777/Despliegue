import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { LoginComponent } from '../login/login';
import { AdminPanelComponent } from '../admin-panel/admin-panel';

@Component({
  selector: 'app-encabezado',
  standalone: true,
  imports: [CommonModule, LoginComponent, AdminPanelComponent],
  templateUrl: './encabezado.html',
  styleUrls: ['./encabezado.css']
})
export class EncabezadoComponent {
  @Output() logoClick = new EventEmitter<void>();
  isLoggedIn = false;
  mostrarLogin = false;
  mostrarAdminPanel = false;

  constructor(public authService: AuthService) {
    this.authService.isLoggedIn$.subscribe(state => this.isLoggedIn = state);
  }

  onLogoClick() {
    this.logoClick.emit();
  }

  handleLogout() {
    this.authService.logout();
  }
}
