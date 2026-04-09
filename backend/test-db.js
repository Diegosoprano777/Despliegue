const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'tareas_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error conexión MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a MySQL');

  db.query('DESCRIBE administradores', (err, results) => {
    if (err) {
      console.error('❌ Error describiendo tabla:', err.message);
    } else {
      console.log('🔎 Estructura de administradores:');
      console.table(results);
    }

    db.query('SELECT username FROM administradores', (err, results) => {
      if (err) {
        console.error('❌ Error consultando usuarios:', err.message);
      } else {
        console.log('👤 Administradores existentes:');
        console.table(results);
      }
      db.end();
    });
  });
});
