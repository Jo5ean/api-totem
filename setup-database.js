// Script para configurar la base de datos inicial
const { PrismaClient } = require('./src/generated/prisma');

async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa a MySQL');
    
    // Verificar si las tablas existen
    const facultades = await prisma.facultad.findMany();
    console.log(`📊 Facultades en BD: ${facultades.length}`);
    
    if (facultades.length === 0) {
      console.log('📝 Insertando facultades iniciales...');
      
      const facultadesIniciales = [
        {
          nombre: 'Facultad de Ciencias Jurídicas',
          codigo: 'FCJ',
          sheetId: '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc'
        },
        {
          nombre: 'Facultad de Arquitectura y Urbanismo',
          codigo: 'FAU',
          sheetId: '1xJBRTnfNMlcfGHLo_9y96taH5JCNdlIw_fYiuAIy7kQ'
        },
        {
          nombre: 'Facultad de Economía y Administración',
          codigo: 'FEA',
          sheetId: '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk'
        },
        {
          nombre: 'Escuela Universitaria de Educación Física',
          codigo: 'EUEF',
          sheetId: '1cUk1wAObM1u0ErEIh98XXz6NTxGcKLVt3orJczSgCAU'
        },
        {
          nombre: 'Facultad de Educación',
          codigo: 'FE',
          sheetId: '1G2gL5bqy85gE5mOGTTlN7PPTAbKoeIcDYJineSPqut0'
        },
        {
          nombre: 'Facultad de Ingeniería',
          codigo: 'FI',
          sheetId: '10-IUeW-NZMvZkwwxxjspdNG9-jbBvtXhgWG3Bcwxqr0'
        },
        {
          nombre: 'Facultad de Turismo',
          codigo: 'FT',
          sheetId: '1saPHBuYV0L6_NN1mcsEABIDCKa2SXINMYK2sZIsOxwo'
        }
      ];
      
      for (const facultad of facultadesIniciales) {
        await prisma.facultad.create({
          data: facultad
        });
        console.log(`✅ Creada: ${facultad.nombre}`);
      }
      
      console.log('🎉 Facultades iniciales creadas exitosamente');
    }
    
    // Mostrar resumen
    const resumen = await prisma.facultad.findMany({
      include: {
        carreras: {
          include: {
            examenes: true
          }
        }
      }
    });
    
    console.log('\n📊 RESUMEN DE LA BASE DE DATOS:');
    resumen.forEach(facultad => {
      const totalExamenes = facultad.carreras.reduce((total, carrera) => 
        total + carrera.examenes.length, 0
      );
      console.log(`🏛️ ${facultad.nombre}: ${facultad.carreras.length} carreras, ${totalExamenes} exámenes`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que MySQL esté ejecutándose');
      console.log('2. Verifica la DATABASE_URL en tu archivo .env');
      console.log('3. Asegúrate de que la base de datos existe');
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 