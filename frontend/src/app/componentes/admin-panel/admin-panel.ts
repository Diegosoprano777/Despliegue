import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UsuariosService, UsuarioBackend } from '../../services/usuarios.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent {
  @Output() cerrar = new EventEmitter<void>();

  pestanaActiva: 'crear' | 'editar' | 'gestionar' | 'crear-usuario' | 'gestionar-usuarios' = 'crear';

  // Formularios
  nuevoAdmin = { username: '', password: '' };
  editarAdmin = { username: '', password: '' };
  administradores: any[] = [];
  adminEditandoClave: number | null = null;
  nuevaClaveAdmin: string = '';

  mensaje = '';
  error = '';
  cargando = false;

  // Formularios de usuarios
  nuevoUsuario = { nombre: '', imagen: 'default-user.jpg' };
  usuariosObj: UsuarioBackend[] = [];
  usuarioEditando: number | null = null;
  editarUsuarioDatos = { nombre: '', imagen: '' };

  avatares = ['ana.jpg', 'carlos.jpg', 'fernanda.jpg', 'fabian.jpg', 'laura.jpg', 'miguel.jpg'];

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private cd: ChangeDetectorRef
  ) {}

  cambiarPestana(pestana: 'crear' | 'editar' | 'gestionar' | 'crear-usuario' | 'gestionar-usuarios') {
    this.pestanaActiva = pestana;
    this.mensaje = '';
    this.error = '';
    this.cargando = false;
    this.nuevoAdmin = { username: '', password: '' };
    this.editarAdmin = { username: '', password: '' };
    this.adminEditandoClave = null;
    this.nuevaClaveAdmin = '';
    
    this.usuarioEditando = null;
    
    if (pestana === 'gestionar') {
      this.cargarAdministradores();
    }
    
    // Obtener los usuarios si vamos a gestionar usuarios
    if (pestana === 'gestionar-usuarios') {
        this.usuariosObj = this.usuariosService.usuarios();
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

  iniciarEdicionClave(id: number) {
    this.adminEditandoClave = id;
    this.nuevaClaveAdmin = '';
    this.cd.detectChanges();
  }

  cancelarEdicionClave() {
    this.adminEditandoClave = null;
    this.nuevaClaveAdmin = '';
    this.cd.detectChanges();
  }

  guardarNuevaClave(id: number) {
    if (!this.nuevaClaveAdmin) {
      this.error = 'Ingrese la nueva contraseña.';
      return;
    }
    this.cargando = true;
    this.cd.detectChanges();
    this.authService.cambiarPasswordAdmin(id, this.nuevaClaveAdmin).subscribe({
      next: () => {
        this.mensaje = 'Contraseña actualizada con éxito.';
        this.error = '';
        this.cancelarEdicionClave();
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error al actualizar contraseña.';
        this.mensaje = '';
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

  // ============== MÉTODOS DE USUARIOS =================

  seleccionarAvatar(avatar: string) {
    if (this.pestanaActiva === 'crear-usuario') {
      this.nuevoUsuario.imagen = avatar;
    } else if (this.usuarioEditando) {
      this.editarUsuarioDatos.imagen = avatar;
    }
  }

  crearUsuarioBD() {
    if (!this.nuevoUsuario.nombre) {
      this.error = 'Ingrese un nombre.';
      return;
    }
    this.cargando = true;
    this.usuariosService.crearUsuario(this.nuevoUsuario.nombre, this.nuevoUsuario.imagen)
      .subscribe({
        next: () => {
          this.mensaje = 'Usuario creado con éxito.';
          this.nuevoUsuario = { nombre: '', imagen: 'default-user.jpg' };
          this.error = '';
          this.cargando = false;
        },
        error: (err) => {
          this.error = 'Error creando usuario.';
          this.cargando = false;
        }
      });
  }

  iniciarEdicionUsuario(u: UsuarioBackend) {
    this.usuarioEditando = u.id;
    this.editarUsuarioDatos = { nombre: u.nombre, imagen: u.imagen };
  }

  cancelarEdicionUsuario() {
    this.usuarioEditando = null;
  }

  guardarEdicionUsuario(id: number) {
    if (!this.editarUsuarioDatos.nombre) return;
    this.cargando = true;
    this.usuariosService.editarUsuario(id, this.editarUsuarioDatos.nombre, this.editarUsuarioDatos.imagen)
      .subscribe({
        next: () => {
          this.mensaje = 'Actualizado con éxito.';
          this.usuarioEditando = null;
          this.cargando = false;
          this.usuariosObj = this.usuariosService.usuarios();
        },
        error: () => {
          this.error = 'Error actualizando usuario.';
          this.cargando = false;
        }
      });
  }

  borrarUsuario(id: number, nombre: string) {
    if (!confirm(`¿Eliminar al usuario "${nombre}" y todas sus tareas permanentemente?`)) return;
    this.cargando = true;
    this.usuariosService.eliminarUsuario(id).subscribe({
      next: () => {
        this.mensaje = 'Usuario eliminado.';
        this.cargando = false;
        this.usuariosObj = this.usuariosService.usuarios();
      },
      error: () => {
        this.error = 'Error al eliminar usuario.';
        this.cargando = false;
      }
    });
  }
}
