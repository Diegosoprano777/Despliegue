const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function cleanAdmins() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'tareas_db'
  });

  try {
    console.log('🧹 Limpiando tabla de administradores...');
    await connection.execute('DELETE FROM administradores');
    
    console.log('🌱 Re-sembrando administrador por defecto...');
    const hashedPassword = await bcrypt.hash('admin123', 4);
    await connection.execute('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
    
    console.log('✅ Base de datos de administradores limpia y restaurada.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
  }
}

cleanAdmins();
