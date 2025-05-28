// Script simple para probar la conexión a MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a MySQL...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ No encontrada');
    
    if (!process.env.DATABASE_URL) {
      console.log('❌ Por favor configura DATABASE_URL en tu archivo .env');
      return;
    }
    
    // Parsear la URL de conexión
    const url = new URL(process.env.DATABASE_URL);
    const config = {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1) // Remover el "/"
    };
    
    console.log('📊 Configuración de conexión:');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Usuario: ${config.user}`);
    console.log(`   Base de datos: ${config.database}`);
    console.log(`   Contraseña: ${config.password ? '***' : '(vacía)'}`);
    
    // Intentar conexión
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Conexión exitosa a MySQL!');
    
    // Verificar si la base de datos existe
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === config.database);
    
    if (dbExists) {
      console.log(`✅ Base de datos '${config.database}' existe`);
      
      // Verificar tablas existentes
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📋 Tablas existentes: ${tables.length}`);
      
      if (tables.length > 0) {
        console.log('   Tablas:', tables.map(t => Object.values(t)[0]).join(', '));
      } else {
        console.log('   (No hay tablas aún - esto es normal para una BD nueva)');
      }
    } else {
      console.log(`❌ Base de datos '${config.database}' NO existe`);
      console.log('💡 Créala en DBeaver: Click derecho → Create → Database');
    }
    
    await connection.end();
    console.log('\n🎉 Test de conexión completado!');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. ¿Está MySQL ejecutándose?');
      console.log('2. ¿El puerto 3306 está correcto?');
      console.log('3. ¿Puedes conectarte desde DBeaver?');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Error de autenticación:');
      console.log('1. Verifica usuario y contraseña');
      console.log('2. Asegúrate de que el usuario tenga permisos');
    }
  }
}

testConnection(); 