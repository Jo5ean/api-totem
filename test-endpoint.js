// Script para probar endpoints de Google Sheets API directamente
// Ejecutar con: node test-endpoint.js

const SHEET_ID = '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc';
const API_KEY = 'TU_API_KEY_AQUI'; // Reemplaza con tu API key

async function testEndpoints() {
  console.log('🔍 PROBANDO ENDPOINTS DE GOOGLE SHEETS API\n');
  
  // 1. ENDPOINT PARA OBTENER PESTAÑAS/HOJAS
  console.log('📋 1. ENDPOINT PARA OBTENER PESTAÑAS:');
  console.log(`URL: https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`);
  console.log('Método: GET\n');
  
  try {
    const response1 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`);
    const data1 = await response1.json();
    
    console.log('📡 RESPONSE STATUS:', response1.status);
    console.log('📡 RESPONSE HEADERS:', Object.fromEntries(response1.headers.entries()));
    console.log('📊 RESPONSE JSON COMPLETO:');
    console.log(JSON.stringify(data1, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // 2. ENDPOINT PARA OBTENER DATOS DE UNA PESTAÑA ESPECÍFICA
    if (data1.sheets && data1.sheets.length > 0) {
      const primeraPestaña = data1.sheets[0].properties.title;
      
      console.log('📋 2. ENDPOINT PARA OBTENER DATOS DE PESTAÑA:');
      console.log(`URL: https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(primeraPestaña)}?key=${API_KEY}`);
      console.log('Método: GET');
      console.log(`Pestaña: "${primeraPestaña}"\n`);
      
      const response2 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(primeraPestaña)}?key=${API_KEY}`);
      const data2 = await response2.json();
      
      console.log('📡 RESPONSE STATUS:', response2.status);
      console.log('📡 RESPONSE HEADERS:', Object.fromEntries(response2.headers.entries()));
      console.log('📊 RESPONSE JSON COMPLETO:');
      console.log(JSON.stringify(data2, null, 2));
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testEndpoints();
}

module.exports = { testEndpoints }; 