/**
 * Script de seed para cargar datos iniciales
 * Ejecutar: node scripts/seed.js
 */

import database from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Cargando datos iniciales...\n');

    // Limpiar tablas existentes
    console.log('Limpiando tablas...');
    await database.query('DELETE FROM audit_logs');
    await database.query('DELETE FROM tasks');
    await database.query('DELETE FROM voters');
    await database.query('DELETE FROM zones');
    await database.query('DELETE FROM users');

    // Crear zonas
    console.log('📍 Creando zonas...');
    const zoneResult = await database.query(
      `INSERT INTO zones (name, priority, manager, description) VALUES
       ($1, $2, $3, $4),
       ($5, $6, $7, $8),
       ($9, $10, $11, $12)
       RETURNING id`,
      [
        'Zona Centro', 1, 'Carlos Rodríguez', 'Sector céntrico de la ciudad',
        'Zona Norte', 2, 'María García', 'Barrios del norte',
        'Zona Sur', 3, 'Juan López', 'Barrios del sur'
      ]
    );
    const [zoneId1, zoneId2, zoneId3] = zoneResult.rows.map(r => r.id);
    console.log(`✅ ${zoneResult.rows.length} zonas creadas\n`);

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const operatorHash = await bcrypt.hash('Operator123!', 10);

    const userResult = await database.query(
      `INSERT INTO users (name, email, password_hash, role, phone, zone_id, active) VALUES
       ($1, $2, $3, $4, $5, $6, true),
       ($7, $8, $9, $10, $11, $12, true),
       ($13, $14, $15, $16, $17, $18, true),
       ($19, $20, $21, $22, $23, $24, true)
       RETURNING id, name, role`,
      [
        'Admin Usuario', 'admin@abaco.com', adminHash, 'admin', '555-0001', zoneId1,
        'Carlos Operador', 'carlos@abaco.com', operatorHash, 'operator', '555-0002', zoneId1,
        'María Operadora', 'maria@abaco.com', operatorHash, 'operator', '555-0003', zoneId2,
        'Juan Auditor', 'juan@abaco.com', operatorHash, 'auditor', '555-0004', zoneId3
      ]
    );
    console.log(`✅ ${userResult.rows.length} usuarios creados\n`);
    const [adminId, operatorId1, operatorId2] = userResult.rows.map(r => r.id);

    // Crear votantes
    console.log('🗳️ Creando votantes...');
    const voterResult = await database.query(
      `INSERT INTO voters (name, dni, phone, email, address, zone_id, status, priority, latitude, longitude) VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15, $16, $17, $18, $19, $20),
       ($21, $22, $23, $24, $25, $26, $27, $28, $29, $30),
       ($31, $32, $33, $34, $35, $36, $37, $38, $39, $40),
       ($41, $42, $43, $44, $45, $46, $47, $48, $49, $50)
       RETURNING id`,
      [
        'Juan Pérez', '12345678', '555-1001', 'juan@example.com', 'Calle Principal 123', zoneId1, 'pending', 'high', -34.6037, -58.3816,
        'María García', '23456789', '555-1002', 'maria@example.com', 'Av. 9 de Julio 456', zoneId1, 'confirmed', 'high', -34.6045, -58.3850,
        'Carlos López', '34567890', '555-1003', 'carlos@example.com', 'Calle Florida 789', zoneId2, 'pending', 'medium', -34.6100, -58.3750,
        'Ana Martínez', '45678901', '555-1004', 'ana@example.com', 'Paseo Colón 101', zoneId2, 'confirmed', 'low', -34.6200, -58.3600,
        'Roberto Díaz', '56789012', '555-1005', 'roberto@example.com', 'Calle Corrientes 202', zoneId3, 'pending', 'medium', -34.6050, -58.3950
      ]
    );
    console.log(`✅ ${voterResult.rows.length} votantes creados\n`);

    // Crear tareas
    console.log('📋 Creando tareas...');
    const taskResult = await database.query(
      `INSERT INTO tasks (title, description, assigned_to, status, priority, due_date, type) VALUES
       ($1, $2, $3, $4, $5, $6, $7),
       ($8, $9, $10, $11, $12, $13, $14),
       ($15, $16, $17, $18, $19, $20, $21),
       ($22, $23, $24, $25, $26, $27, $28)
       RETURNING id`,
      [
        'Contactar votantes Zona Centro', 'Llamar a todos los votantes pendientes', operatorId1, 'in_progress', 'high', '2026-03-15', 'outreach',
        'Verificación de datos', 'Verificar información de votantes en Zona Norte', operatorId2, 'pending', 'medium', '2026-03-20', 'verification',
        'Campaña Zona Sur', 'Distribución de material en Zona Sur', operatorId1, 'pending', 'high', '2026-03-25', 'campaign',
        'Reporte semanal', 'Preparar reporte de avance de campaña', operatorId2, 'completed', 'low', '2026-03-10', 'admin'
      ]
    );
    console.log(`✅ ${taskResult.rows.length} tareas creadas\n`);

    console.log('✨ Datos iniciales cargados correctamente!');
    console.log('\n📊 Credenciales de prueba:');
    console.log('Admin: admin@abaco.com / Admin123!');
    console.log('Operador: carlos@abaco.com / Operator123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cargar datos:', error);
    process.exit(1);
  }
}

seed();
