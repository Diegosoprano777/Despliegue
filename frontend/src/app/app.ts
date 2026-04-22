import { Component, OnInit, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncabezadoComponent } from './componentes/encabezado/encabezado';
import { UsuarioComponent } from './componentes/usuario/usuario';
import { TareasComponent } from './componentes/tareas/tareas';
import { AuthService } from './services/auth.service';
import { UsuariosService, UsuarioBackend } from './services/usuarios.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    EncabezadoComponent,
    UsuarioComponent,
    TareasComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, OnDestroy {
  idUsuarioSeleccionado: number | null = null;
  private subAdmins?: Subscription;

  // Acceso público a la signal de usuarios para el template
  private usuariosService = inject(UsuariosService);
  usuarios = this.usuariosService.usuarios; 

  constructor(
    private authService: AuthService
  ) {
    // Si necesitas reaccionar a cambios puedes usar effect() aquí si fuera necesario
  }

  ngOnInit() {
    this.cargarUsuariosGenerales();
    
    // Escuchar cuando se añaden nuevos colegas para refrescar... Opcional. 
    // Ahora todo va reactivo, pero si el auth-service expulsa eventos también:
    this.subAdmins = this.authService.adminsActualizados$.subscribe(() => {
      this.cargarUsuariosGenerales();
    });
  }

  ngOnDestroy() {
    this.subAdmins?.unsubscribe();
  }

  cargarUsuariosGenerales() {
    // Esto actualizará la Signal automáticamente (RF-07)
    this.usuariosService.cargarUsuarios().subscribe();
  }


  get usuarioSeleccionado() {
    return this.usuarios().find(u => u.id === this.idUsuarioSeleccionado) || null;
  }

  get idParaTareas(): number {
    const user = this.usuarioSeleccionado;
    if (!user) return 0;
    return user.id;
  }

  seleccionarUsuario(id: number | null) {
    this.idUsuarioSeleccionado = id;
  }
}