import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UsuarioBackend {
  id: number;
  nombre: string;
  imagen: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  // Signal para almacenar la lista de usuarios (RF-07)
  private usuariosSignal = signal<UsuarioBackend[]>([]);

  // Computed public para exponer los usuarios de forma reactiva
  public usuarios = computed(() => this.usuariosSignal());

  constructor(private http: HttpClient) {}

  // Leer todos (RF-02)
  cargarUsuarios() {
    return this.http.get<UsuarioBackend[]>(this.apiUrl).pipe(
      tap(usuarios => this.usuariosSignal.set(usuarios))
    );
  }

  // Crear usuario
  crearUsuario(nombre: string, imagen: string) {
    return this.http.post<{id: number, mensaje: string}>(this.apiUrl, { nombre, imagen }).pipe(
      tap(() => this.cargarUsuarios().subscribe()) // Recargar tras crear
    );
  }

  // Editar usuario
  editarUsuario(id: number, nombre: string, imagen: string) {
    return this.http.put(`${this.apiUrl}/${id}`, { nombre, imagen }).pipe(
      tap(() => this.cargarUsuarios().subscribe()) // Recargar tras editar
    );
  }

  // Eliminar usuario
  eliminarUsuario(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cargarUsuarios().subscribe()) // Recargar tras eliminar
    );
  }
}
