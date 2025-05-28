// Configuración simple para testing
const FACULTADES_TEST = [
  {
    nombre: 'Facultad de Ciencias Jurídicas',
    sheetId: '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc'
  },
  {
    nombre: 'Facultad de Arquitectura y Urbanismo', 
    sheetId: '1xJBRTnfNMlcfGHLo_9y96taH5JCNdlIw_fYiuAIy7kQ'
  },
  {
    nombre: 'Facultad de Economía y Administración',
    sheetId: '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk'
  },
  {
    nombre: 'Facultad de Ingeniería',
    sheetId: '10-IUeW-NZMvZkwwxxjspdNG9-jbBvtXhgWG3Bcwxqr0'
  }
];

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || req.query.apiKey;

    if (!apiKey) {
      throw new Error('API_KEY es requerida');
    }

    console.log('🧪 Testing facultades...');

    const resultados = [];

    for (const facultad of FACULTADES_TEST) {
      console.log(`\n🔍 Testing ${facultad.nombre}...`);
      
      try {
        // Test básico: ver si el documento existe
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${facultad.sheetId}?key=${apiKey}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const hojas = data.sheets || [];
          const hojasCarreras = hojas.filter(h => /^\d+/.test(h.properties.title));
          
          resultados.push({
            nombre: facultad.nombre,
            status: 'OK ✅',
            documento: data.properties?.title || 'Sin título',
            totalHojas: hojas.length,
            hojasCarreras: hojasCarreras.length,
            primerasHojas: hojas.slice(0, 3).map(h => h.properties.title)
          });
          
          console.log(`✅ ${facultad.nombre}: OK (${hojasCarreras.length} carreras)`);
        } else {
          resultados.push({
            nombre: facultad.nombre,
            status: `Error ${response.status} ❌`,
            error: `HTTP ${response.status}`
          });
          console.log(`❌ ${facultad.nombre}: Error ${response.status}`);
        }
      } catch (error) {
        resultados.push({
          nombre: facultad.nombre,
          status: 'Error ❌',
          error: error.message
        });
        console.log(`❌ ${facultad.nombre}: ${error.message}`);
      }
    }

    res.status(200).json({
      mensaje: 'Test de facultades completado',
      timestamp: new Date().toISOString(),
      resultados: resultados,
      resumen: {
        total: FACULTADES_TEST.length,
        exitosas: resultados.filter(r => r.status.includes('✅')).length,
        conError: resultados.filter(r => r.status.includes('❌')).length
      }
    });

  } catch (error) {
    console.error('❌ Error en test:', error);
    res.status(500).json({ 
      error: 'Error en test de facultades',
      message: error.message
    });
  }
} 