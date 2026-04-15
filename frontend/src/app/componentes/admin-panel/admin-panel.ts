import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent {
  @Output() cerrar = new EventEmitter<void>();

  pestanaActiva: 'crear' | 'editar' | 'gestionar' = 'crear';

  // Formularios
  nuevoAdmin = { username: '', password: '' };
  editarAdmin = { username: '', password: '' };
  administradores: any[] = [];

  mensaje = '';
  error = '';
  cargando = false;

  constructor(
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  cambiarPestana(pestana: 'crear' | 'editar' | 'gestionar') {
    this.pestanaActiva = pestana;
    this.mensaje = '';
    this.error = '';
    this.cargando = false;
    this.nuevoAdmin = { username: '', password: '' };
    this.editarAdmin = { username: '', password: '' };
    
    if (pestana === 'gestionar') {
      this.cargarAdministradores();
    }
    
    this.cd.detectChanges();
  }

  cargarAdministradores() {
    this.cargando = true;
    this.cd.detectChanges();
    this.authService.getAdministradores().subscribe({
      next: (admins) => {
        this.administradores = admins;
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.error = 'Error cargando lista de colegas';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  borrarAdministrador(id: number, username: string) {
    if (!confirm(`¿Estás seguro que deseas eliminar al colega "${username}"? Sus tareas también serán eliminadas de forma permanente.`)) {
      return;
    }
    this.cargando = true;
    this.cd.detectChanges();
    this.authService.eliminarAdmin(id).subscribe({
      next: () => {
        this.mensaje = `Colega "${username}" eliminado exitosamente.`;
        this.cargarAdministradores();
        this.authService.notificarCambioAdmins();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al eliminar.';
        this.cargando = false;
        this.cd.detectChanges();
      }
    });
  }

  crearAdministrador() {
    if (!this.nuevoAdmin.username || !this.nuevoAdmin.password) {
      this.error = 'Llene todos los campos.';
      this.mensaje = '';
      this.cd.detectChanges();
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.cargando = true;
    this.cd.detectChanges();

    this.authService.registrarAdmin(this.nuevoAdmin.username, this.nuevoAdmin.password)
      .subscribe({
        next: () => {
          this.mensaje = '¡Administrador creado con éxito!';
          this.nuevoAdmin = { username: '', password: '' };
          this.cargando = false;
          this.authService.notificarCambioAdmins();
          this.cd.detectChanges(); // ← Forzar actualización de la UI
        },
        error: (err) => {
          console.error('Error registro:', err);
          this.error = err.error?.mensaje || 'Error al conectar con el servidor.';
          this.cargando = false;
          this.cd.detectChanges(); // ← Forzar actualización de la UI
        }
      });
  }

  actualizarPerfil() {
    if (!this.editarAdmin.username || !this.editarAdmin.password) {
      this.error = 'Llene todos los campos.';
      this.mensaje = '';
      this.cd.detectChanges();
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.cargando = true;
    this.cd.detectChanges();

    this.authService.editarPerfil(this.editarAdmin.username, this.editarAdmin.password)
      .subscribe({
        next: () => {
          this.mensaje = '¡Perfil actualizado con éxito!';
          this.editarAdmin = { username: '', password: '' };
          this.cargando = false;
          this.authService.notificarCambioAdmins();
          this.cd.detectChanges(); // ← Forzar actualización de la UI
        },
        error: (err) => {
          console.error('Error perfil:', err);
          this.error = err.error?.mensaje || 'Error al conectar con el servidor.';
          this.cargando = false;
          this.cd.detectChanges(); // ← Forzar actualización de la UI
        }
      });
  }
}
