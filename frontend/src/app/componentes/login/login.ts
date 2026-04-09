import { ChangeDetectorRef } from '@angular/core';
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  @Output() cerrar = new EventEmitter<void>();
  username = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private cd: ChangeDetectorRef) {}

  onSubmit() {
    console.log('🔥 Intentando hacer login con', this.username);
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        console.log('✅ Login exitoso en TS');
        this.cerrar.emit();
      },
      error: (e) => {
        console.error('❌ Error de servidor: ', e);
        this.error = 'Credenciales inválidas o no hay conexión db';
        this.cd.detectChanges();
      }
    });
  }
}
