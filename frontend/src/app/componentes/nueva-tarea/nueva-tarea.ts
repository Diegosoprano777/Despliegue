import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../services/tarea.service';

@Component({
  selector: 'app-nueva-tarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrls: ['./nueva-tarea.css']
})
export class NuevaTareaComponent {

  @Input() idUsuario!: number;

  titulo = '';
  resumen = '';
  fecha = '';

  @Output() cancelar = new EventEmitter<void>();
  @Output() tareaCreada = new EventEmitter<void>();

  constructor(private tareasService: TareasService) {}

  cerrar() {
    this.cancelar.emit();
  }

  crearTarea() {
    console.log('ID USUARIO 🔥:', this.idUsuario);

    // 1. VALIDACIÓN DE USUARIO
    if (!this.idUsuario || isNaN(Number(this.idUsuario))) {
      alert('Error: No se ha seleccionado un usuario válido');
      return;
    }

    // 2. VALIDACIÓN DE CAMPOS VACÍOS
    if (!this.titulo.trim() || !this.fecha) {
      alert('Por favor, completa al menos el título y la fecha');
      return;
    }

    // 3. ESTRUCTURA DEL OBJETO (Corregida)
    const nuevaTarea = {
      id: 't' + new Date().getTime().toString(), // ID único basado en tiempo
      idUsuario: Number(this.idUsuario),         // Aseguramos que sea número
      titulo: this.titulo,
      resumen: this.resumen,
      expira: this.fecha,
      completada: false                          // ✅ Importante para que funcione el botón Terminar
    };

    console.log('Enviando nueva tarea al servidor:', nuevaTarea);

    // 4. LLAMADA AL SERVICIO
    this.tareasService.agregarTarea(nuevaTarea).subscribe({
      next: (tareaGuardada) => {
        console.log('¡Tarea guardada con éxito! 🔥', tareaGuardada);
        
        // Avisamos al padre para que recargue la lista
        this.tareaCreada.emit(); 
        this.cerrar();

        // Limpiamos los campos para la próxima vez
        this.limpiarFormulario();
      },
      error: (err) => {
        console.error('Error al guardar en el servidor ❌', err);
        alert('No se pudo guardar la tarea. Revisa que el servidor esté corriendo.');
      }
    });
  }

  private limpiarFormulario() {
    this.titulo = '';
    this.resumen = '';
    this.fecha = '';
  }
}