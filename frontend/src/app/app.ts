import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncabezadoComponent } from './componentes/encabezado/encabezado';
import { UsuarioComponent } from './componentes/usuario/usuario';
import { TareasComponent } from './componentes/tareas/tareas';
import { USUARIOS_FALSOS } from './usuario-falsos';
import { AuthService } from './services/auth.service';
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
  usuarios: any[] = [...USUARIOS_FALSOS];
  idUsuarioSeleccionado: number | null = null;
  private subAdmins?: Subscription;

  constructor(
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarUsuariosReales();
    
    // Escuchar cuando se añaden nuevos colegas para refrescar la lista al instante
    this.subAdmins = this.authService.adminsActualizados$.subscribe(() => {
      this.cargarUsuariosReales();
    });
  }

  ngOnDestroy() {
    this.subAdmins?.unsubscribe();
  }

  cargarUsuariosReales() {
    this.authService.getAdministradores().subscribe(admins => {
      // Mapeamos los administradores reales a la estructura de la interfaz
      const reales = admins.map(a => ({
        id: a.id + 1000, 
        dbId: a.id, // Guardamos el ID real de la base de datos
        nombre: a.username,
        imagen: 'default-user.jpg',
        esReal: true
      }));

      this.usuarios = [...USUARIOS_FALSOS, ...reales];
      this.cd.detectChanges();
    });
  }

  get usuarioSeleccionado() {
    return this.usuarios.find(u => u.id === this.idUsuarioSeleccionado) || null;
  }

  get idParaTareas() {
    // Si es un usuario real, usamos su dbId, si no, su id normal
    const user = this.usuarioSeleccionado;
    if (!user) return null;
    return user.dbId || user.id;
  }

  seleccionarUsuario(id: number | null) {
    this.idUsuarioSeleccionado = id;
    this.cd.detectChanges(); 
  }
}