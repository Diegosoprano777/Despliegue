require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbConfig = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL || {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
  user: process.env.MYSQLUSER || process.env.MYSQL_USER,
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
  port: process.env.MYSQLPORT || process.env.MYSQL_PORT,
  charset: 'utf8mb4'
};

if (typeof dbConfig === 'object' && process.env.MYSQL_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: true };
  if (process.env.MYSQL_CA_CERT) {
    dbConfig.ssl.ca = process.env.MYSQL_CA_CERT;
  } else if (process.env.MYSQL_CA_PATH) {
    try {
      dbConfig.ssl.ca = fs.readFileSync(process.env.MYSQL_CA_PATH).toString();
    } catch (err) {
      console.warn('⚠️ No se pudo leer el archivo de certificado SSL:', err.message);
    }
  }
}

async function setup() {
  console.log('Iniciando configuración de la base de datos...');
  
  let connection;
  try {
    const baseConfig = typeof dbConfig === 'string' ? dbConfig : { ...dbConfig };
    const dbName = typeof baseConfig === 'string' ? new URL(baseConfig).pathname.slice(1) : baseConfig.database;
    if (typeof baseConfig !== 'string') { delete baseConfig.database; }

    connection = await mysql.createConnection(baseConfig);
    console.log('✅ Conexión al servidor MySQL establecida.');
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Base de datos "${dbName}" lista.`);

    // 1. Crear tabla administradores
    await connection.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    // Administrador por defecto
    const [adminRows] = await connection.query('SELECT COUNT(*) as count FROM administradores');
    if (adminRows[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 4);
      await connection.query('INSERT INTO administradores (username, password) VALUES (?, ?)', ['admin', hashedPassword]);
      console.log('✅ Creado administrador por defecto ("admin").');
    }

    // 2. Crear tabla usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        imagen VARCHAR(255) DEFAULT 'default-user.jpg'
      )
    `);

    // Poblar usuarios iniciales si está vacío
    const [usuarioRows] = await connection.query('SELECT COUNT(*) as count FROM usuarios');
    if (usuarioRows[0].count === 0) {
      const usuariosIniciales = [
        ['Ana', 'ana.jpg'],
        ['Carlos', 'carlos.jpg'],
        ['Fernanda', 'fernanda.jpg'],
        ['Fabian', 'fabian.jpg'],
        ['Laura', 'laura.jpg'],
        ['Miguel', 'miguel.jpg']
      ];
      await connection.query(
        'INSERT INTO usuarios (nombre, imagen) VALUES ?',
        [usuariosIniciales]
      );
      console.log('✅ Poblando tabla con usuarios por defecto.');
    }

    // 3. Modificar o Recrear tabla tareas (Con Cascading Delete)
    await connection.query('DROP TABLE IF EXISTS tareas'); // Precaución: eliminamos para asegurar el foreign key en modo dev.
    
    await connection.query(`
      CREATE TABLE tareas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        resumen TEXT,
        expira DATE,
        idUsuario INT,
        completada TINYINT(1) DEFAULT 0,
        FOREIGN KEY (idUsuario) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla de tareas recreada con integridad referencial (ON DELETE CASCADE).');

    console.log('🎉 Setup finalizado correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setup();
