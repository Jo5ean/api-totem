// Script para generar caches de todas las facultades
const fetch = require('node-fetch');

const FACULTADES = [
  'economia-administracion',
  'ingenieria', 
  'ciencias-juridicas',
  'arquitectura-urbanismo',
  'educacion-fisica',
  'educacion',
  'turismo'
];

async function probarFacultad(facultad) {
  console.log(`\n🔄 Procesando ${facultad}...`);
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`http://localhost:3000/api/cronogramas/${facultad}?force=true`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${facultad.toUpperCase()}: ÉXITO`);
      console.log(`🏛️ Facultad: ${data.facultad?.nombre || 'No detectada'}`);
      console.log(`📋 Carreras: ${data.resumen?.totalCarreras || 0}`);
      console.log(`📅 Exámenes: ${data.resumen?.totalExamenes || 0}`);
      
      if (data.resumen?.totalCarreras > 0) {
        console.log(`📝 Carreras encontradas:`);
        Object.entries(data.carreras || {}).forEach(([codigo, info]) => {
          console.log(`   - ${codigo}: ${info.nombre} (${info.examenes?.length || 0} exámenes)`);
        });
      }
      
      return { facultad, status: 'success', ...data.resumen };
    } else {
      console.log(`❌ ${facultad.toUpperCase()}: ERROR`);
      console.log(`🚨 Error: ${data.error}`);
      return { facultad, status: 'error', error: data.error };
    }
    
  } catch (error) {
    console.log(`💥 ${facultad.toUpperCase()}: FALLO DE CONEXIÓN`);
    console.log(`🚨 Error: ${error.message}`);
    return { facultad, status: 'connection_error', error: error.message };
  }
}

async function procesarTodasLasFacultades() {
  console.log('🚀 INICIANDO DESCARGA Y CACHE DE TODAS LAS FACULTADES');
  console.log('📅 Fecha:', new Date().toLocaleString('es-ES'));
  console.log('🎯 Facultades a procesar:', FACULTADES.length);
  console.log('⚠️ Esto puede tomar varios minutos...\n');
  
  const resultados = [];
  
  for (const facultad of FACULTADES) {
    const resultado = await probarFacultad(facultad);
    resultados.push(resultado);
    
    // Pausa entre requests para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Resumen final
  console.log('\n🎉 PROCESO COMPLETADO');
  console.log('='.repeat(70));
  
  const exitosas = resultados.filter(r => r.status === 'success');
  const errores = resultados.filter(r => r.status === 'error');
  const fallos = resultados.filter(r => r.status === 'connection_error');
  
  console.log(`\n📊 RESUMEN FINAL:`);
  console.log(`✅ Exitosas: ${exitosas.length}/${FACULTADES.length}`);
  console.log(`❌ Con errores: ${errores.length}/${FACULTADES.length}`);
  console.log(`💥 Fallos de conexión: ${fallos.length}/${FACULTADES.length}`);
  
  if (exitosas.length > 0) {
    console.log(`\n🎯 FACULTADES FUNCIONANDO:`);
    exitosas.forEach(r => {
      const totalExamenes = r.totalExamenes || 0;
      const totalCarreras = r.totalCarreras || 0;
      console.log(`   ✅ ${r.facultad}: ${totalCarreras} carreras, ${totalExamenes} exámenes`);
    });
  }
  
  if (errores.length > 0) {
    console.log(`\n⚠️ FACULTADES CON ERRORES:`);
    errores.forEach(r => {
      console.log(`   ❌ ${r.facultad}: ${r.error}`);
    });
  }
  
  if (fallos.length > 0) {
    console.log(`\n💥 FACULTADES CON FALLOS DE CONEXIÓN:`);
    fallos.forEach(r => {
      console.log(`   💥 ${r.facultad}: ${r.error}`);
    });
  }
  
  // Calcular estadísticas totales
  const totalExamenes = exitosas.reduce((sum, r) => sum + (r.totalExamenes || 0), 0);
  const totalCarreras = exitosas.reduce((sum, r) => sum + (r.totalCarreras || 0), 0);
  
  console.log(`\n🎊 ESTADÍSTICAS TOTALES DEL SISTEMA:`);
  console.log(`📚 Total carreras procesadas: ${totalCarreras}`);
  console.log(`📅 Total exámenes encontrados: ${totalExamenes}`);
  console.log(`🏛️ Facultades operativas: ${exitosas.length}/7`);
  console.log(`⚡ Tasa de éxito: ${Math.round((exitosas.length / FACULTADES.length) * 100)}%`);
  
  console.log(`\n🎯 ENDPOINTS LISTOS PARA USAR:`);
  console.log(`📋 Directorio general: http://localhost:3000/api/cronogramas`);
  exitosas.forEach(r => {
    console.log(`🔗 ${r.facultad}: http://localhost:3000/api/cronogramas/${r.facultad}`);
  });
}

// Ejecutar script
procesarTodasLasFacultades().catch(console.error); 