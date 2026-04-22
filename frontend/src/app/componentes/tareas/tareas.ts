import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Tarea } from '../../models/tarea.model';
import { TareasService } from '../../services/tarea.service';
import { TareaComponent } from '../tarea/tarea'; 
import { NuevaTareaComponent } from '../nueva-tarea/nueva-tarea';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule, TareaComponent, NuevaTareaComponent],
  templateUrl: './tareas.html',
  styleUrls: ['./tareas.css']
})
export class TareasComponent implements OnInit, OnChanges {
  @Input() nombre: string = '';
  @Input() idUsuario!: number;

  tareas: Tarea[] = [];
  mostrarFormulario = false;
  cargando = false;
  isLoggedIn = false;
  tareaEnEdicion: Tarea | null = null;
  editModalVisible = false;
  editFormData = { titulo: '', resumen: '', expira: '' };

  constructor(
    private tareasService: TareasService,
    private cd: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(state => this.isLoggedIn = state);
    this.recargarTareas();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idUsuario'] && !changes['idUsuario'].firstChange) {
      this.recargarTareas();
    }
  }

  abrirFormulario() {
    this.tareaEnEdicion = null;
    this.mostrarFormulario = true; 
    this.cd.detectChanges(); // Forzar apertura visual
  }

  cerrarFormulario() { 
    this.mostrarFormulario = false; 
    this.tareaEnEdicion = null;
    this.cd.detectChanges(); // Forzar cierre visual
  }

  recargarTareas() {
    this.cargando = true;
    this.tareasService.obtenerTareas().subscribe({
      next: (data) => {
        // Filtramos las tareas por el ID del usuario seleccionado
        this.tareas = data.filter(t => Number(t.idUsuario) === Number(this.idUsuario));
        this.cargando = false;
        // ✅ 3. Obligar a Angular a pintar las tareas nuevas o filtradas
        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar:', err);
        this.cargando = false;
      }
    });
  }

  marcarComoCompletada(idTarea: string) {
    this.tareasService.marcarComoCompletada(idTarea, true).subscribe({
      next: () => {
        console.log('Tarea terminada en el servidor');
        this.recargarTareas(); // Esto ya tiene el detectChanges adentro
      },
      error: (err) => console.error('Error al terminar tarea:', err)
    });
  }

  reabrirTarea(idTarea: string) {
    this.tareasService.marcarComoCompletada(idTarea, false).subscribe({
      next: () => {
        console.log('Tarea reabierta en el servidor');
        this.recargarTareas();
      },
      error: (err) => console.error('Error al reabrir tarea:', err)
    });
  }

  eliminarTarea(idTarea: string) {
    this.tareasService.eliminarTarea(idTarea).subscribe({
      next: () => {
        console.log('Tarea eliminada del servidor');
        this.recargarTareas(); // Esto ya tiene el detectChanges adentro
      },
      error: (err) => console.error('Error al eliminar:', err)
    });
  }

  iniciarEdicion(tarea: Tarea) {
    this.tareaEnEdicion = tarea;
    this.editFormData = {
      titulo: tarea.titulo,
      resumen: tarea.resumen || '',
      expira: tarea.expira ? tarea.expira.split('T')[0] : '' // Formato YYYY-MM-DD
    };
    this.editModalVisible = true;
    this.cd.detectChanges();
  }

  cerrarEdicion() {
    this.editModalVisible = false;
    this.tareaEnEdicion = null;
    this.cd.detectChanges();
  }

  guardarEdicion() {
    if (!this.tareaEnEdicion || !this.editFormData.titulo) return;

    this.tareasService.editarTarea(this.tareaEnEdicion.id, {
      titulo: this.editFormData.titulo,
      resumen: this.editFormData.resumen,
      expira: this.editFormData.expira,
      idUsuario: this.tareaEnEdicion.idUsuario
    }).subscribe({
      next: () => {
        this.cerrarEdicion();
        this.recargarTareas();
      },
      error: (err) => console.error('Error al editar:', err)
    });
  }
}