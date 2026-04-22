require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecreto123';

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
].filter(Boolean);

console.log('🌐 Allowed CORS Origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // permite recibir JSON

// ========================================
//  CONEXIÓN MYSQL
// ========================================
const dbConfig = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL || {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'tareas_db2',
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
  charset: 'utf8mb4'
};
const db = mysql.createPool(typeof dbConfig === 'string' ? dbConfig : {
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('📡 Database configuration initialized (Pool Mode)');

// Inicialización de base de datos
const initDB = async () => {
  try {
    // Probar conexión
    const promisePool = db.promise();
    await promisePool.query('SELECT 1');
    console.log('✅ Conectado a MySQL exitosamente.');

    // Auto-Seeding Administradores
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM administradores');
    if (rows[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 4);
      await promisePool.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('✅ Seeding: Administrador por defecto (admin) creado exitosamente.');
    }

    // Crear tabla usuarios si no existe
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        imagen VARCHAR(255) DEFAULT 'default-user.jpg'
      )
    `);

    // Asegurarnos de que tareas existe
    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS tareas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        resumen TEXT,
        expira DATE,
        idUsuario INT,
        completada TINYINT(1) DEFAULT 0,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
  } catch (err) {
    console.error('❌ Error inicializando base de datos:', err);
  }
};

initDB();

// Middleware JWT
function validarToken(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ mensaje: 'No hay token proporcionado' });

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

// =========================
// ENDPOINTS AUTENTICACIÓN
// =========================

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan credenciales' });
  }

  db.query('SELECT * FROM administradores WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('❌ Error de DB en login:', err);
      return res.status(500).json({ mensaje: 'Error de base de datos', detalle: err.message });
    }
    if (results.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const admin = results[0];
    const match = await bcrypt.compare(password, admin.password);

    if (!match) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username });
  });
});

// Crear nuevo administrador (Protegido)
app.post('/api/admin', validarToken, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ mensaje: 'Datos incompletos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 4);
    db.query('INSERT INTO administradores (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ mensaje: 'El nombre de usuario ya existe' });
        }
        return res.status(500).json({ mensaje: 'Error al crear', error: err });
      }
      res.json({ id: result.insertId, mensaje: 'Administrador creado!' });
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Editar perfil del administrador actual (Protegido)
app.put('/api/admin/perfil', validarToken, async (req, res) => {
  const adminId = req.admin.id;
  const { nuevoUsername, nuevoPassword } = req.body;

  if (!nuevoUsername || !nuevoPassword) {
    return res.status(400).json({ mensaje: 'Datos incompletos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(nuevoPassword, 4);
    const sql = 'UPDATE administradores SET username = ?, password = ? WHERE id = ?';
    db.query(sql, [nuevoUsername, hashedPassword, adminId], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso' });
        }
        return res.status(500).json({ mensaje: 'Error al actualizar', error: err });
      }
      res.json({ mensaje: 'Perfil actualizado correctamente' });
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

app.get('/api/administradores', (req, res) => {
  db.query('SELECT id, username FROM administradores', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Eliminar administrador y sus tareas (Protegido)
app.delete('/api/admin/:id', validarToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tareas WHERE idUsuario = ?', [id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al limpiar tareas del usuario', error: err });
    db.query('DELETE FROM administradores WHERE id = ?', [id], (err2) => {
      if (err2) return res.status(500).json({ mensaje: 'Error al eliminar administrador', error: err2 });
      res.json({ mensaje: 'Administrador y sus tareas eliminados correctamente' });
    });
  });
});

// Cambiar contraseña de cualquier administrador (Protegido)
app.put('/api/admin/:id/password', validarToken, async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;
  if (!nuevaPassword) {
    return res.status(400).json({ mensaje: 'No se envió la nueva contraseña' });
  }

  try {
    const hashedPassword = await bcrypt.hash(nuevaPassword, 4);
    db.query('UPDATE administradores SET password = ? WHERE id = ?', [hashedPassword, id], (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al cambiar contraseña', error: err });
      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// =========================
// ENDPOINTS USUARIOS (Gestión)
// =========================

app.get('/api/usuarios', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/usuarios', validarToken, (req, res) => {
  const { nombre, imagen } = req.body;
  if (!nombre) return res.status(400).json({ mensaje: 'Falta el nombre' });
  const img = imagen || 'default-user.jpg';
  
  db.query('INSERT INTO usuarios (nombre, imagen) VALUES (?, ?)', [nombre, img], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, mensaje: 'Usuario creado exitosamente' });
  });
});

app.put('/api/usuarios/:id', validarToken, (req, res) => {
  const { id } = req.params;
  const { nombre, imagen } = req.body;
  if (!nombre || !imagen) return res.status(400).json({ mensaje: 'Datos incompletos' });

  db.query('UPDATE usuarios SET nombre = ?, imagen = ? WHERE id = ?', [nombre, imagen, id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al actualizar usuario', error: err });
    res.json({ mensaje: 'Usuario actualizado correctamente' });
  });
});

app.delete('/api/usuarios/:id', validarToken, (req, res) => {
  const { id } = req.params;
  // Gracias al ON DELETE CASCADE de la tabla, las tareas se eliminarán solas
  db.query('DELETE FROM usuarios WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al eliminar usuario', error: err });
    res.json({ mensaje: 'Usuario y sus tareas (cascada) eliminados' });
  });
});

// =========================
// ENDPOINTS TAREAS
// =========================

// PÚBLICA: Ver tareas
app.get('/tareas', (req, res) => {
  const sql = 'SELECT * FROM tareas';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// PROTEGIDA: Crear tarea
app.post('/tareas', validarToken, (req, res) => {
  const { titulo, resumen, expira, idUsuario } = req.body;
  const sql = 'INSERT INTO tareas (titulo, resumen, expira, idUsuario, completada) VALUES (?, ?, ?, ?, 0)';

  db.query(sql, [titulo, resumen, expira, idUsuario], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, mensaje: 'Tarea creada correctamente' });
  });
});

// PROTEGIDA: Completar tarea
app.patch('/tareas/:id', validarToken, (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE tareas SET completada = 1 WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: 'Tarea completada' });
  });
});

// PROTEGIDA: Editar tarea
app.put('/tareas/:id', validarToken, (req, res) => {
  const { id } = req.params;
  const { titulo, resumen, expira, idUsuario } = req.body;
  const sql = 'UPDATE tareas SET titulo = ?, resumen = ?, expira = ?, idUsuario = ? WHERE id = ?';

  db.query(sql, [titulo, resumen, expira, idUsuario, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: 'Tarea actualizada correctamente' });
  });
});

// PROTEGIDA: Eliminar tarea
app.delete('/tareas/:id', validarToken, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM tareas WHERE id = ?';

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: 'Tarea eliminada' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});