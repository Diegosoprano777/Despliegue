export interface Tarea {
  id: string;
  idUsuario: number;
  titulo: string;
  resumen: string;
  expira: string;
  completada?: boolean; // 🔥 nuevo campo
}