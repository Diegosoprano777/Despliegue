import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Tarea } from '../../models/tarea.model';
import { TarjetaComponent } from '../tarjeta/tarjeta';

@Component({
  selector: 'app-tarea',
  standalone: true,
  imports: [CommonModule, TarjetaComponent, DatePipe],
  templateUrl: './tarea.html',
  styleUrls: ['./tarea.css']
})
export class TareaComponent {

  @Input() tarea!: Tarea;
  @Input() isEditable = false;

  @Output() eliminar = new EventEmitter<string>();
  @Output() editar = new EventEmitter<Tarea>();

  // 🔥 NUEVO
  @Output() completar = new EventEmitter<string>();

  eliminarTarea() {
    if (!this.tarea || !this.tarea.id) {
      console.error('❌ ID de tarea inválido');
      return;
    }

    console.log('🗑 Eliminando tarea:', this.tarea.id);

    this.eliminar.emit(this.tarea.id);
  }

  // 🔥 NUEVO
  completarTarea() {
    if (!this.tarea || !this.tarea.id) {
      console.error('❌ ID inválido para completar');
      return;
    }

    console.log('✅ Completando tarea:', this.tarea.id);

    this.completar.emit(this.tarea.id);
  }

  editarTarea() {
    this.editar.emit(this.tarea);
  }
}
