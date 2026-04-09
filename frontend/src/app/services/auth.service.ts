import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedIn.asObservable();

  // Canal para notificar cuando se crean/editan administradores
  private adminsActualizados = new Subject<void>();
  public adminsActualizados$ = this.adminsActualizados.asObservable();

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res: any) => {
        if (res.token) {
          localStorage.setItem('admin_token', res.token);
          this.loggedIn.next(true);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    this.loggedIn.next(false);
  }

  registrarAdmin(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin`, { username, password });
  }

  editarPerfil(nuevoUsername: string, nuevoPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/perfil`, { nuevoUsername, nuevoPassword });
  }

  getAdministradores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/administradores`);
  }

  notificarCambioAdmins() {
    this.adminsActualizados.next();
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('admin_token');
  }
}
