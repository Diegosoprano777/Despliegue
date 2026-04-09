import { Component, EventEmitter, Input, Output } from '@angular/core';

interface Usuario {
  id: number;
  imagen: string;
  nombre: string;
}

@Component({
  selector: 'app-usuario',
  standalone: true,
  templateUrl: './usuario.html',
  styleUrl: './usuario.css'
})
export class UsuarioComponent {

  @Input({ required: true }) usuario!: Usuario;
  @Input() seleccionado: boolean = false;

  // ✅ Cambiado a 'seleccionar' para que coincida con app.html
  @Output() seleccionar = new EventEmitter<number>();

  // ✅ Cambiado a 'seleccionarUsuario' para que coincida con tu (click) del HTML
  seleccionarUsuario() {
    console.log('Hiciste clic en:', this.usuario.nombre);
    this.seleccionar.emit(this.usuario.id);
  }
}