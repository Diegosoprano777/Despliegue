import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tarea } from '../models/tarea.model';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private apiUrl = `${environment.apiUrl}/tareas`;

  constructor(private http: HttpClient) {}

  obtenerTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(this.apiUrl);
  }

  agregarTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.post<Tarea>(this.apiUrl, tarea);
  }

  eliminarTarea(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // ✅ Este método es el que usará el botón "Terminar"
  marcarComoCompletada(id: string): Observable<Tarea> {
    return this.http.patch<Tarea>(`${this.apiUrl}/${id}`, {
      completada: true
    });
  }

  // ✅ Este método sirve para editar tareas existentes
  editarTarea(id: string | number, tarea: Partial<Tarea>): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.apiUrl}/${id}`, tarea);
  }
}