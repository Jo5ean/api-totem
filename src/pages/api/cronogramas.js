// Configuración de las facultades con sus respectivos SHEET_ID
const FACULTADES_CONFIG = {
  'Facultad de Ciencias Jurídicas': {
    sheetId: '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc',
    nombre: 'Facultad de Ciencias Jurídicas'
  },
  'Facultad de Arquitectura y Urbanismo': {
    sheetId: '1xJBRTnfNMlcfGHLo_9y96taH5JCNdlIw_fYiuAIy7kQ',
    nombre: 'Facultad de Arquitectura y Urbanismo'
  },
  'Facultad de Economía y Administración': {
    sheetId: '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk',
    nombre: 'Facultad de Economía y Administración'
  },
  'Escuela Universitaria de Educación Física': {
    sheetId: '1cUk1wAObM1u0ErEIh98XXz6NTxGcKLVt3orJczSgCAU',
    nombre: 'Escuela Universitaria de Educación Física'
  },
  'Facultad de Educación': {
    sheetId: '1G2gL5bqy85gE5mOGTTlN7PPTAbKoeIcDYJineSPqut0',
    nombre: 'Facultad de Educación'
  },
  'Facultad de Ingeniería': {
    sheetId: '10-IUeW-NZMvZkwwxxjspdNG9-jbBvtXhgWG3Bcwxqr0',
    nombre: 'Facultad de Ingeniería'
  },
  'Facultad de Turismo': {
    sheetId: '1saPHBuYV0L6_NN1mcsEABIDCKa2SXINMYK2sZIsOxwo',
    nombre: 'Facultad de Turismo'
  },
  // TODO: Agregar las otras facultades restantes cuando se proporcionen
};

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      // Verificar si se solicita una facultad específica o todas
      const facultadEspecifica = req.query.facultad;
      const debug = req.query.debug === 'true';
      
      if (facultadEspecifica) {
        return await getCronogramasFacultadEspecifica(req, res, facultadEspecifica, debug);
      } else {
        return await getCronogramasTodasFacultades(req, res, debug);
      }
    default:
      return res.status(405).json({ message: 'Método no permitido' });
  }
}

/**
 * Obtener información del documento de Google Sheets
 */
async function obtenerInfoDocumento(sheetId, apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      titulo: data.properties?.title || 'Facultad Desconocida',
      hojas: data.sheets || []
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Obtener datos de una hoja específica
 */
async function obtenerDatosHoja(nombreHoja, sheetId, apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(nombreHoja)}!A1:Z1000?key=${apiKey}`;
  
  try {
    console.log(`🔍 Obteniendo datos de hoja: ${nombreHoja}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`📄 RESPUESTA RAW DE HOJA "${nombreHoja}":`, JSON.stringify(data, null, 2));
    
    return data.values || [];
  } catch (error) {
    console.error(`Error al obtener datos de ${nombreHoja}:`, error);
    return [];
  }
}

/**
 * Extraer nombre de facultad de los datos de la hoja
 */
function extraerFacultadDeHoja(datos) {
  console.log(`🔍 Buscando facultad en ${datos.length} filas de datos...`);
  
  // Primero buscar nombre explícito de facultad
  for (let i = 0; i < Math.min(10, datos.length); i++) {
    const fila = datos[i];
    if (!fila || fila.length === 0) continue;
    
    // Buscar en todas las columnas de la fila
    for (let j = 0; j < Math.min(5, fila.length); j++) {
      if (fila[j] && typeof fila[j] === 'string') {
        const texto = fila[j].trim().toUpperCase();
        
        // Buscar patrones explícitos de facultad
        if (texto.includes('FACULTAD') || texto.includes('ESCUELA')) {
          const facultadCompleta = fila[j].trim();
          console.log(`🏛️ ✅ Facultad encontrada explícitamente: "${facultadCompleta}"`);
          return facultadCompleta;
        }
      }
    }
  }
  
  console.log('🔍 No se encontró nombre explícito, analizando materias para detectar facultad...');
  
  // Si no encuentra nombre explícito, analizar las materias para inferir la facultad
  for (let i = 2; i < datos.length; i++) { // Empezar desde fila 3 (datos)
    const fila = datos[i];
    if (!fila || fila.length < 2) continue;
    
    const materia = fila[1]; // La materia suele estar en la segunda columna
    if (materia && typeof materia === 'string') {
      const materiaUpper = materia.trim().toUpperCase();
      console.log(`🔍 Analizando materia: "${materiaUpper}"`);
      
      // Detectar por materias de derecho/ciencias jurídicas
      if (materiaUpper.includes('Dº') || 
          materiaUpper.includes('DERECHO') ||
          materiaUpper.includes('TEORÍA') ||
          materiaUpper.includes('CONSTITUC') ||
          materiaUpper.includes('ADMINISTRATIVO') ||
          materiaUpper.includes('PENAL') ||
          materiaUpper.includes('CIVIL') ||
          materiaUpper.includes('ROMANO') ||
          materiaUpper.includes('CONTRATOS') ||
          materiaUpper.includes('CRIMINOLOG') ||
          materiaUpper.includes('JURÍDIC') ||
          materiaUpper.includes('PROCUR') ||
          materiaUpper.includes('PROCESAL') ||
          materiaUpper.includes('NOTARIAL')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de derecho: "Facultad de Ciencias Jurídicas"`);
        return 'Facultad de Ciencias Jurídicas';
      }
      
      // Detectar por materias de ingeniería
      if (materiaUpper.includes('MATEMÁTIC') ||
          materiaUpper.includes('FÍSIC') ||
          materiaUpper.includes('QUÍMIC') ||
          materiaUpper.includes('INGENIE') ||
          materiaUpper.includes('TECNOLOG') ||
          materiaUpper.includes('SISTEM') ||
          materiaUpper.includes('ALGORITMOS') ||
          materiaUpper.includes('PROGRAMACIÓN') ||
          materiaUpper.includes('CÁLCULO') ||
          materiaUpper.includes('ÁLGEBRA')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de ingeniería: "Facultad de Ingeniería"`);
        return 'Facultad de Ingeniería';
      }
      
      // Detectar por materias de arquitectura
      if (materiaUpper.includes('ARQUITEC') ||
          materiaUpper.includes('DISEÑO') ||
          materiaUpper.includes('URBAN') ||
          materiaUpper.includes('CONSTRUCCIÓN') ||
          materiaUpper.includes('MORFOLOG') ||
          materiaUpper.includes('REPRESENTACIÓN') ||
          materiaUpper.includes('PROYECTO') ||
          materiaUpper.includes('COMPOSICIÓN')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de arquitectura: "Facultad de Arquitectura y Urbanismo"`);
        return 'Facultad de Arquitectura y Urbanismo';
      }
      
      // Detectar por materias de economía/administración
      if (materiaUpper.includes('ECONOMÍ') ||
          materiaUpper.includes('ADMINISTR') ||
          materiaUpper.includes('CONTAB') ||
          materiaUpper.includes('FINANZA') ||
          materiaUpper.includes('MARKETING') ||
          materiaUpper.includes('RECURSOS HUMANOS') ||
          materiaUpper.includes('GESTIÓN') ||
          materiaUpper.includes('EMPRESA') ||
          materiaUpper.includes('MICROECONOM') ||
          materiaUpper.includes('MACROECONOM') ||
          materiaUpper.includes('ESTADÍSTICA') && materiaUpper.includes('ECONÓM')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de economía: "Facultad de Economía y Administración"`);
        return 'Facultad de Economía y Administración';
      }
      
      // Detectar por materias de educación física
      if (materiaUpper.includes('EDUCACIÓN FÍSICA') ||
          materiaUpper.includes('DEPORTES') ||
          materiaUpper.includes('GIMNASIA') ||
          materiaUpper.includes('RECREACIÓN') ||
          materiaUpper.includes('ENTRENAMIENTO') ||
          materiaUpper.includes('MOTRICIDAD') ||
          materiaUpper.includes('ANATOMÍA') && materiaUpper.includes('DEPORTIVA') ||
          materiaUpper.includes('FISIOLOGÍA') && materiaUpper.includes('EJERCICIO')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de educación física: "Escuela Universitaria de Educación Física"`);
        return 'Escuela Universitaria de Educación Física';
      }
      
      // Detectar por materias de educación general
      if (materiaUpper.includes('PEDAGOGÍA') ||
          materiaUpper.includes('DIDÁCTICA') ||
          materiaUpper.includes('EDUCACIÓN') ||
          materiaUpper.includes('PSICOLOGÍA EDUCACIONAL') ||
          materiaUpper.includes('CURRICULUM') ||
          materiaUpper.includes('ENSEÑANZA') ||
          materiaUpper.includes('APRENDIZAJE') ||
          materiaUpper.includes('FILOSOFÍA DE LA EDUCACIÓN')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de educación: "Facultad de Educación"`);
        return 'Facultad de Educación';
      }
      
      // Detectar por materias de turismo
      if (materiaUpper.includes('TURISMO') ||
          materiaUpper.includes('HOTELERÍA') ||
          materiaUpper.includes('GASTRONOMÍA') ||
          materiaUpper.includes('HOSPEDAJE') ||
          materiaUpper.includes('AGENCIA DE VIAJES') ||
          materiaUpper.includes('PATRIMONIO CULTURAL') ||
          materiaUpper.includes('GEOGRAFÍA TURÍSTICA') ||
          materiaUpper.includes('SERVICIOS TURÍSTICOS')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de turismo: "Facultad de Turismo"`);
        return 'Facultad de Turismo';
      }
      
      // Detectar por materias de salud
      if (materiaUpper.includes('MEDICINA') ||
          materiaUpper.includes('ANATOMÍA') ||
          materiaUpper.includes('FISIOLOGÍA') ||
          materiaUpper.includes('FARMACOLOGÍA') ||
          materiaUpper.includes('BIOLOGÍA') ||
          materiaUpper.includes('SALUD') ||
          materiaUpper.includes('ENFERMERÍA') ||
          materiaUpper.includes('KINESIOLOGÍA') ||
          materiaUpper.includes('ODONTOLOGÍA')) {
        console.log(`🏛️ ✅ Facultad detectada por materias de salud: "Facultad de Ciencias de la Salud"`);
        return 'Facultad de Ciencias de la Salud';
      }
    }
  }
  
  console.log('⚠️ No se pudo determinar la facultad');
  return 'Facultad Desconocida';
}

/**
 * Detectar fila de cabeceras dinámicamente
 */
function detectarCabeceras(datos) {
  // Buscar la fila que contenga palabras clave como "CARRERA", "MATERIA", "FECHA", etc.
  for (let i = 0; i < Math.min(10, datos.length); i++) {
    const fila = datos[i];
    if (fila && fila.length > 0) {
      const textoFila = fila.join(' ').toUpperCase();
      if (textoFila.includes('CARRERA') || 
          textoFila.includes('MATERIA') || 
          textoFila.includes('FECHA') ||
          textoFila.includes('HORA')) {
        console.log(`📋 Cabeceras detectadas en fila ${i + 1}:`, fila);
        return { indiceCabeceras: i, cabeceras: fila };
      }
    }
  }
  
  // Si no se encuentra, asumir fila 1 (índice 1)
  console.log('⚠️ No se detectaron cabeceras específicas, usando fila 2 por defecto');
  return { indiceCabeceras: 1, cabeceras: datos[1] || [] };
}

/**
 * Detectar índices de columnas basándose en las cabeceras reales
 */
function detectarIndicesColumnas(cabeceras) {
  const indices = {
    nombre: -1,
    fecha: -1,
    hora: -1,
    tipoExamen: -1,
    monitoreo: -1,
    material: -1,
    observaciones: -1
  };

  console.log(`🔍 Detectando columnas en cabeceras:`, cabeceras);

  for (let i = 0; i < cabeceras.length; i++) {
    const cabecera = (cabeceras[i] || '').toString().toUpperCase().trim();
    
    // Detectar nombre de materia
    if (cabecera.includes('MATERIA') || 
        cabecera.includes('ASIGNATURA') || 
        cabecera.includes('NOMBRE CORTO') ||
        cabecera.includes('NOMBRE') ||
        (i === 1 && indices.nombre === -1)) { // Si es columna 1 y no hemos encontrado nombre
      indices.nombre = i;
      console.log(`📖 Columna NOMBRE detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar fecha
    else if (cabecera.includes('FECHA') || 
             cabecera.includes('DIA') ||
             cabecera.includes('DATE')) {
      indices.fecha = i;
      console.log(`📅 Columna FECHA detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar hora
    else if (cabecera.includes('HORA') || 
             cabecera.includes('HORARIO') ||
             cabecera.includes('TIME')) {
      indices.hora = i;
      console.log(`🕐 Columna HORA detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar tipo de examen
    else if (cabecera.includes('TIPO') || 
             cabecera.includes('EXAMEN') ||
             cabecera.includes('MODALIDAD')) {
      indices.tipoExamen = i;
      console.log(`📝 Columna TIPO EXAMEN detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar monitoreo
    else if (cabecera.includes('MONITOREO') || 
             cabecera.includes('PROCTORING') ||
             cabecera.includes('CONTROL')) {
      indices.monitoreo = i;
      console.log(`👁️ Columna MONITOREO detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar material
    else if (cabecera.includes('MATERIAL') || 
             cabecera.includes('PERMITIDO') ||
             cabecera.includes('CALCULADORA')) {
      indices.material = i;
      console.log(`📋 Columna MATERIAL detectada en índice ${i}: "${cabecera}"`);
    }
    
    // Detectar observaciones
    else if (cabecera.includes('OBSERVACION') || 
             cabecera.includes('COMENTARIO') ||
             cabecera.includes('NOTA')) {
      indices.observaciones = i;
      console.log(`📄 Columna OBSERVACIONES detectada en índice ${i}: "${cabecera}"`);
    }
  }

  // Si no encontramos nombre en cabeceras explícitas, asumir columna 1
  if (indices.nombre === -1) {
    indices.nombre = 1;
    console.log(`📖 Nombre no detectado, usando columna 1 por defecto`);
  }

  // Si no encontramos fecha, buscar en las primeras columnas después del nombre
  if (indices.fecha === -1) {
    for (let i = indices.nombre + 1; i < Math.min(indices.nombre + 4, cabeceras.length); i++) {
      if (i !== indices.hora && i !== indices.tipoExamen) {
        indices.fecha = i;
        console.log(`📅 Fecha no detectada, usando columna ${i} por defecto`);
        break;
      }
    }
  }

  console.log(`📊 Índices finales detectados:`, indices);
  return indices;
}

/**
 * Procesar datos de una hoja y convertirlos a materias
 */
function procesarDatosHoja(datos, nombreCarrera) {
  if (!datos || datos.length < 3) {
    return { materias: [], facultad: 'Facultad Desconocida' };
  }

  // Extraer facultad de los datos
  const facultad = extraerFacultadDeHoja(datos);

  // Detectar cabeceras dinámicamente
  const { indiceCabeceras, cabeceras } = detectarCabeceras(datos);
  const filasMaterias = datos.slice(indiceCabeceras + 1);

  console.log(`🔄 Procesando ${filasMaterias.length} filas de materias...`);
  console.log(`📋 Cabeceras detectadas:`, cabeceras);

  const materias = [];

  for (let i = 0; i < filasMaterias.length; i++) {
    const fila = filasMaterias[i];
    if (!fila || fila.length === 0) continue;

    console.log(`🔍 Procesando fila ${i + 1}:`, fila);

    // Mapear según la estructura real que vemos en los logs
    // Estructura común: [CARRERA, NOMBRE_MATERIA, FECHA, HORA/CATEDRA, TIPO_EXAMEN, MONITOREO, MATERIAL, OBSERVACIONES, DOCENTE?]
    const materia = {
      id: `${nombreCarrera}-${i}`,
      nombre: (fila[1] || '').toString().trim(),
      fecha: (fila[2] || '').toString().trim(),
      hora: '',
      tipoExamen: '',
      monitoreo: '',
      materialPermitido: '',
      observaciones: ''
    };

    // LÓGICA ESPECÍFICA PARA ARQUITECTURA
    if (nombreCarrera.includes('185') || 
        (cabeceras.length > 1 && cabeceras[1] && cabeceras[1].toString().toUpperCase().includes('NOMBRE CORTO'))) {
      // Para Arquitectura: CARRERA | NOMBRE CORTO | Monitoreo | FECHA | Hora | Tipo Examen | Material Permitido | Observaciones
      materia.nombre = (fila[1] || '').toString().trim(); // NOMBRE CORTO en columna 1
      materia.fecha = (fila[2] || '').toString().trim();  // FECHA en columna 3
      materia.hora = (fila[3] || '').toString().trim();   // HORA en columna 4
      materia.tipoExamen = (fila[4] || '').toString().trim(); // TIPO EXAMEN en columna 5
      materia.monitoreo = (fila[5] || '').toString().trim(); // MONITOREO en columna 2
      materia.materialPermitido = (fila[6] || '').toString().trim(); // MATERIAL en columna 6
      materia.observaciones = (fila[7] || '').toString().trim(); // OBSERVACIONES en columna 7
      
      console.log(`🏗️ Arquitectura - Procesando: "${materia.nombre}" | Fecha:"${materia.fecha}" | Hora:"${materia.hora}" | Monitoreo:"${materia.monitoreo}"`);
    }

    // Solo agregar si tiene al menos nombre válido y cumple criterios mínimos
    if (materia.nombre && 
        materia.nombre !== '#REF!' && 
        materia.nombre !== '#N/A' && 
        materia.nombre !== '#ERROR!' &&
        materia.nombre !== '#VALUE!' &&
        materia.nombre !== '#DIV/0!' &&
        materia.nombre !== '#NAME?' &&
        materia.nombre !== '#NULL!' &&
        materia.nombre.length > 2 && // Evitar nombres muy cortos
        !materia.nombre.match(/^[0-9]+$/) && // Evitar números solos
        !materia.nombre.match(/^[A-Z]$/) && // Evitar letras solas
        materia.fecha && 
        materia.fecha !== '#REF!' && 
        materia.fecha !== '#N/A' && 
        materia.fecha !== '#ERROR!' &&
        materia.fecha.length > 3) { // Fecha debe tener contenido mínimo
      
      // Agregar ID único
      materia.id = `${nombreCarrera}-${i}-${materia.nombre.substring(0, 10)}`;
      
      console.log(`✅ Materia procesada:`, materia);
      materias.push(materia);
    } else {
      console.log(`❌ Fila ignorada por datos inválidos:`, fila);
      console.log(`   - Nombre: "${materia.nombre}" (válido: ${materia.nombre && materia.nombre.length > 2})`);
      console.log(`   - Fecha: "${materia.fecha}" (válido: ${materia.fecha && materia.fecha.length > 3})`);
    }
  }

  console.log(`📚 Total de materias procesadas para ${nombreCarrera}: ${materias.length}`);
  return { materias, facultad };
}

/**
 * Agrupar materias por facultad (extraída de los datos reales)
 */
function agruparPorFacultad(todasLasMaterias) {
  const agrupacion = {};
  
  todasLasMaterias.forEach(materia => {
    const facultad = materia.facultad || 'Facultad Desconocida';
    const carrera = materia.nombreCarrera;
    
    if (!agrupacion[facultad]) {
      agrupacion[facultad] = {};
    }
    
    if (!agrupacion[facultad][carrera]) {
      agrupacion[facultad][carrera] = [];
    }
    
    agrupacion[facultad][carrera].push(materia);
  });
  
  return agrupacion;
}

/**
 * Construir JSON jerárquico: Facultad → Carrera → Materias
 */
async function getCronogramasJerarquicos(req, res) {
  try {
    const sheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || req.query.sheetId;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || req.query.apiKey;

    console.log(`🔑 Sheet ID recibido: ${sheetId}`);
    console.log(`🔑 API Key configurada: ${apiKey ? 'SÍ' : 'NO'}`);

    if (!sheetId || !apiKey) {
      throw new Error('SHEET_ID y API_KEY son requeridos');
    }

    // Obtener información del documento
    console.log('📋 Obteniendo información del documento...');
    const infoDocumento = await obtenerInfoDocumento(sheetId, apiKey);
    console.log(`📄 Documento: ${infoDocumento.titulo}`);
    console.log(`📄 Total de hojas encontradas: ${infoDocumento.hojas.length}`);
    console.log(`📄 Nombres de todas las hojas:`, infoDocumento.hojas.map(h => h.properties.title));
    
    // Filtrar hojas de carreras
    const hojasCarreras = infoDocumento.hojas.filter(hoja => {
      const titulo = hoja.properties.title;
      const esCarrera = /^\d+/.test(titulo);
      console.log(`🔍 Analizando hoja "${titulo}": ${esCarrera ? '✅ ES CARRERA' : '❌ NO ES CARRERA'}`);
      return esCarrera;
    });

    console.log(`🎯 Hojas de carreras válidas encontradas: ${hojasCarreras.length}`);
    console.log(`🎯 Lista de hojas de carreras:`, hojasCarreras.map(h => h.properties.title));

    if (hojasCarreras.length === 0) {
      console.log('⚠️ NO SE ENCONTRARON HOJAS DE CARRERAS');
      return res.status(200).json({
        facultad: 'Sin hojas de carreras encontradas',
        carreras: []
      });
    }

    // Procesar carreras y recopilar información de facultades
    const carreras = [];
    const contadorFacultades = {};
    
    for (const hoja of hojasCarreras) {
      const nombreCarrera = hoja.properties.title;
      const codigoCarrera = nombreCarrera.match(/^(\d+)/)?.[1] || '';
      
      console.log(`\n📚 ===== PROCESANDO CARRERA: ${nombreCarrera} =====`);
      
      try {
        const datosHoja = await obtenerDatosHoja(nombreCarrera, sheetId, apiKey);
        console.log(`📊 Datos obtenidos para ${nombreCarrera}: ${datosHoja.length} filas`);
        
        if (datosHoja.length === 0) {
          console.log(`⚠️ ${nombreCarrera}: Sin datos en la hoja`);
          continue;
        }

        const { materias, facultad } = procesarDatosHoja(datosHoja, nombreCarrera);
        console.log(`🏛️ ${nombreCarrera}: Facultad detectada = "${facultad}"`);
        console.log(`📚 ${nombreCarrera}: ${materias.length} materias procesadas`);
        
        // Solo agregar carreras que tengan al menos una materia válida
        if (materias.length > 0) {
          carreras.push({
            nombre: nombreCarrera,
            codigo: codigoCarrera,
            materias: materias
          });

          // Contar ocurrencias de cada facultad
          contadorFacultades[facultad] = (contadorFacultades[facultad] || 0) + 1;
          console.log(`✅ ${nombreCarrera}: Agregada con ${materias.length} materias - Facultad: ${facultad}`);
        } else {
          console.log(`⚠️ ${nombreCarrera}: Ignorada - sin materias válidas después del filtrado`);
        }
      } catch (error) {
        console.error(`❌ Error procesando ${nombreCarrera}:`, error.message);
      }
    }

    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`📚 Total de carreras procesadas: ${carreras.length}`);
    console.log(`🏛️ Distribución de facultades:`, contadorFacultades);

    // Determinar la facultad principal (la que más aparece)
    let facultadPrincipal = 'Facultad Desconocida';
    let maxOcurrencias = 0;
    
    for (const [facultad, ocurrencias] of Object.entries(contadorFacultades)) {
      if (ocurrencias > maxOcurrencias) {
        maxOcurrencias = ocurrencias;
        facultadPrincipal = facultad;
      }
    }

    console.log(`🏛️ Facultad principal seleccionada: ${facultadPrincipal} (${maxOcurrencias} carreras)`);

    // Estructura final
    const respuesta = {
      facultad: facultadPrincipal,
      carreras: carreras
    };

    console.log(`\n🎉 RESPUESTA FINAL:`, JSON.stringify(respuesta, null, 2));

    res.status(200).json(respuesta);

  } catch (error) {
    console.error('❌ Error general:', error);
    res.status(500).json({ 
      error: 'Error al construir cronogramas',
      message: error.message
    });
  }
}

/**
 * Obtener cronogramas de todas las facultades configuradas
 */
async function getCronogramasTodasFacultades(req, res, debug) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || req.query.apiKey;

    if (!apiKey) {
      throw new Error('API_KEY es requerida');
    }

    console.log(`🏫 Procesando ${Object.keys(FACULTADES_CONFIG).length} facultades configuradas...`);

    const todasLasFacultades = [];
    const facultadesProcesadas = [];
    const facultadesConError = [];

    // Procesar cada facultad configurada
    for (const [nombreFacultad, config] of Object.entries(FACULTADES_CONFIG)) {
      console.log(`\n🏛️ ===== PROCESANDO FACULTAD: ${nombreFacultad} =====`);
      
      try {
        const cronogramaFacultad = await procesarFacultad(config.sheetId, config.nombre, apiKey, debug);
        
        // Validar que la facultad tenga datos útiles
        if (cronogramaFacultad && 
            cronogramaFacultad.carreras && 
            cronogramaFacultad.carreras.length > 0) {
          
          // Verificar que al menos una carrera tenga materias
          const carrerasConMaterias = cronogramaFacultad.carreras.filter(carrera => 
            carrera.materias && carrera.materias.length > 0
          );
          
          if (carrerasConMaterias.length > 0) {
            // Solo agregar carreras que tienen materias
            cronogramaFacultad.carreras = carrerasConMaterias;
            todasLasFacultades.push(cronogramaFacultad);
            facultadesProcesadas.push(nombreFacultad);
            
            const totalMaterias = carrerasConMaterias.reduce((total, carrera) => 
              total + (carrera.materias ? carrera.materias.length : 0), 0
            );
            
            console.log(`✅ ${nombreFacultad}: Procesada exitosamente`);
            console.log(`   - ${carrerasConMaterias.length} carreras con datos`);
            console.log(`   - ${totalMaterias} materias en total`);
          } else {
            console.log(`⚠️ ${nombreFacultad}: Tiene carreras pero ninguna con materias válidas`);
            facultadesConError.push({
              nombre: nombreFacultad,
              error: 'Sin materias válidas en ninguna carrera'
            });
          }
        } else {
          console.log(`⚠️ ${nombreFacultad}: Sin carreras válidas encontradas`);
          facultadesConError.push({
            nombre: nombreFacultad,
            error: 'Sin carreras encontradas'
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando ${nombreFacultad}:`, error.message);
        facultadesConError.push({
          nombre: nombreFacultad,
          error: error.message
        });
        // Continuar con la siguiente facultad en caso de error
      }
    }

    console.log(`\n📊 RESUMEN GENERAL:`);
    console.log(`🏫 Facultades configuradas: ${Object.keys(FACULTADES_CONFIG).length}`);
    console.log(`✅ Facultades procesadas exitosamente: ${facultadesProcesadas.length}`);
    console.log(`❌ Facultades con errores: ${facultadesConError.length}`);
    
    if (facultadesProcesadas.length > 0) {
      console.log(`📚 Facultades exitosas:`, facultadesProcesadas);
      const totalCarreras = todasLasFacultades.reduce((total, fac) => total + fac.carreras.length, 0);
      const totalMaterias = todasLasFacultades.reduce((total, fac) => 
        total + fac.carreras.reduce((subTotal, carrera) => subTotal + carrera.materias.length, 0), 0
      );
      console.log(`📊 Total de carreras: ${totalCarreras}`);
      console.log(`📖 Total de materias: ${totalMaterias}`);
    }
    
    if (facultadesConError.length > 0) {
      console.log(`⚠️ Facultades con problemas:`, facultadesConError);
    }

    // Estructura de respuesta con todas las facultades válidas
    const respuesta = {
      totalFacultades: todasLasFacultades.length,
      totalFacultadesConfiguradas: Object.keys(FACULTADES_CONFIG).length,
      facultades: todasLasFacultades,
      debug: {
        facultadesProcesadas,
        facultadesConError
      }
    };

    res.status(200).json(respuesta);

  } catch (error) {
    console.error('❌ Error general procesando todas las facultades:', error);
    res.status(500).json({ 
      error: 'Error al obtener cronogramas de todas las facultades',
      message: error.message
    });
  }
}

/**
 * Obtener cronogramas de una facultad específica
 */
async function getCronogramasFacultadEspecifica(req, res, facultadEspecifica, debug) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || req.query.apiKey;

    if (!apiKey) {
      throw new Error('API_KEY es requerida');
    }

    const config = FACULTADES_CONFIG[facultadEspecifica];
    if (!config) {
      return res.status(404).json({ 
        error: 'Facultad no encontrada',
        facultadesDisponibles: Object.keys(FACULTADES_CONFIG)
      });
    }

    console.log(`🏛️ Procesando facultad específica: ${facultadEspecifica}`);
    
    const cronogramaFacultad = await procesarFacultad(config.sheetId, config.nombre, apiKey, debug);
    
    if (cronogramaFacultad) {
      const respuesta = {
        ...cronogramaFacultad,
        timestamp: new Date().toISOString()
      };

      // Si está en modo debug, agregar información adicional
      if (debug) {
        // Obtener información completa de todas las hojas para comparar
        const infoDocumento = await obtenerInfoDocumento(config.sheetId, apiKey);
        const todasLasHojas = infoDocumento.hojas.filter(hoja => /^\d+/.test(hoja.properties.title));
        
        respuesta.debug = {
          totalHojasEncontradas: todasLasHojas.length,
          carrerasActivas: cronogramaFacultad.carreras.length,
          carrerasFiltradasCount: todasLasHojas.length - cronogramaFacultad.carreras.length,
          todasLasHojas: todasLasHojas.map(h => ({
            titulo: h.properties.title,
            hidden: h.properties.hidden || false,
            index: h.properties.index
          })),
          carrerasActivas: cronogramaFacultad.carreras.map(c => c.nombre),
          mensaje: `Se filtraron ${todasLasHojas.length - cronogramaFacultad.carreras.length} carreras inactivas de ${todasLasHojas.length} hojas totales`
        };
      }

      res.status(200).json(respuesta);
    } else {
      res.status(404).json({ 
        error: 'No se encontraron datos para esta facultad',
        facultad: facultadEspecifica
      });
    }

  } catch (error) {
    console.error(`❌ Error procesando facultad ${facultadEspecifica}:`, error);
    res.status(500).json({ 
      error: 'Error al obtener cronogramas de la facultad',
      message: error.message,
      facultad: facultadEspecifica
    });
  }
}

/**
 * Procesar una facultad individual (versión simplificada y confiable)
 */
async function procesarFacultad(sheetId, nombreFacultadConfig, apiKey, debug) {
  try {
    console.log(`\n🏛️ Procesando ${nombreFacultadConfig} (${sheetId})`);
    
    // Obtener información del documento
    const infoDocumento = await obtenerInfoDocumento(sheetId, apiKey);
    console.log(`📄 Documento: ${infoDocumento.titulo}`);
    
    // Filtrar hojas de carreras (que empiezan con número)
    const hojasCarreras = infoDocumento.hojas.filter(hoja => {
      const titulo = hoja.properties.title;
      const esCarrera = /^\d+/.test(titulo);
      const noEstaOculta = !hoja.properties.hidden;
      return esCarrera && noEstaOculta;
    });

    console.log(`🎯 Hojas de carreras encontradas: ${hojasCarreras.length}`);

    if (hojasCarreras.length === 0) {
      console.log(`⚠️ ${nombreFacultadConfig}: Sin hojas de carreras`);
      return null;
    }

    // Procesar carreras y filtrar las que tienen contenido real
    const carreras = [];
    
    for (const hoja of hojasCarreras) {
      const nombreCarrera = hoja.properties.title;
      const codigoCarrera = nombreCarrera.match(/^(\d+)/)?.[1] || '';
      
      try {
        console.log(`📚 Analizando carrera: ${nombreCarrera}`);
        const datosHoja = await obtenerDatosHoja(nombreCarrera, sheetId, apiKey);
        
        if (datosHoja.length === 0) {
          console.log(`⚠️ ${nombreCarrera}: Sin datos en la hoja`);
          continue;
        }

        // Verificar si la carrera tiene contenido real (más que solo cabeceras)
        const tieneContenidoReal = verificarContenidoReal(datosHoja, nombreCarrera);
        
        if (!tieneContenidoReal) {
          console.log(`⚠️ ${nombreCarrera}: Sin contenido real - CARRERA INACTIVA`);
          continue;
        }

        // Procesar materias solo si la carrera está activa
        const materias = procesarMateriasSimple(datosHoja, nombreCarrera);
        
        if (materias.length > 0) {
          carreras.push({
            nombre: nombreCarrera,
            codigo: codigoCarrera,
            materias: materias
          });
          console.log(`✅ ${nombreCarrera}: CARRERA ACTIVA - ${materias.length} materias procesadas`);
        } else {
          console.log(`⚠️ ${nombreCarrera}: Sin materias válidas después del procesamiento`);
        }
      } catch (error) {
        console.error(`❌ Error procesando carrera ${nombreCarrera}:`, error.message);
      }
    }

    console.log(`📊 ${nombreFacultadConfig}: ${carreras.length} carreras ACTIVAS (de ${hojasCarreras.length} hojas analizadas)`);

    return {
      facultad: nombreFacultadConfig,
      carreras: carreras
    };

  } catch (error) {
    console.error(`❌ Error procesando facultad ${nombreFacultadConfig}:`, error);
    return null;
  }
}

/**
 * Verificar si una carrera tiene contenido real (está activa)
 */
function verificarContenidoReal(datos, nombreCarrera) {
  if (!datos || datos.length < 3) {
    return false;
  }

  console.log(`🔍 Verificando contenido real para ${nombreCarrera}...`);

  // Buscar fila de cabeceras
  let indiceCabeceras = 1;
  for (let i = 0; i < Math.min(5, datos.length); i++) {
    const fila = datos[i];
    if (fila && fila.length > 0) {
      const textoFila = fila.join(' ').toUpperCase();
      if (textoFila.includes('MATERIA') || textoFila.includes('FECHA') || textoFila.includes('CARRERA')) {
        indiceCabeceras = i;
        break;
      }
    }
  }

  const cabeceras = datos[indiceCabeceras] || [];
  const filasDatos = datos.slice(indiceCabeceras + 1);
  
  // Detectar índices dinámicamente
  const indices = detectarIndicesColumnas(cabeceras);
  
  // Contar filas con contenido real (no vacías, no errores)
  let filasConContenidoReal = 0;
  let materiasConNombreYFecha = 0;

  for (const fila of filasDatos) {
    if (!fila || fila.length === 0) continue;

    // Verificar si la fila tiene contenido real
    const tieneContenido = fila.some(celda => 
      celda && 
      typeof celda === 'string' && 
      celda.trim().length > 0 && 
      !celda.includes('#REF') && 
      !celda.includes('#N/A') &&
      !celda.includes('#ERROR') &&
      !celda.includes('#VALUE') &&
      !celda.includes('#DIV/0') &&
      !celda.includes('#NAME') &&
      !celda.includes('#NULL')
    );

    if (tieneContenido) {
      filasConContenidoReal++;

      // Verificar si tiene nombre de materia y fecha válidos usando los índices detectados
      const nombreMateria = indices.nombre >= 0 ? (fila[indices.nombre] || '').toString().trim() : '';
      const fecha = indices.fecha >= 0 ? (fila[indices.fecha] || '').toString().trim() : '';

      if (nombreMateria && 
          nombreMateria.length >= 3 && 
          !nombreMateria.includes('#') &&
          /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(nombreMateria) &&
          fecha && 
          fecha.length >= 4 && 
          !fecha.includes('#')) {
        materiasConNombreYFecha++;
      }
    }
  }

  console.log(`📊 ${nombreCarrera}: ${filasConContenidoReal} filas con contenido, ${materiasConNombreYFecha} materias válidas`);

  // Criterios más flexibles para considerar una carrera como ACTIVA:
  // 1. Al menos 1 materia con nombre y fecha válidos
  // 2. Al menos 1 fila con contenido real (removido el requisito de 3 filas)
  const esActiva = materiasConNombreYFecha >= 1 && filasConContenidoReal >= 1;

  console.log(`${esActiva ? '✅' : '❌'} ${nombreCarrera}: ${esActiva ? 'ACTIVA' : 'INACTIVA'}`);
  
  return esActiva;
}

/**
 * Procesar materias de forma simple y confiable
 */
function procesarMateriasSimple(datos, nombreCarrera) {
  if (!datos || datos.length < 3) {
    return [];
  }

  console.log(`🔄 Procesando materias para ${nombreCarrera}`);
  
  // Buscar fila de cabeceras (que contenga "MATERIA", "FECHA", etc.)
  let indiceCabeceras = 1; // Por defecto fila 2
  for (let i = 0; i < Math.min(5, datos.length); i++) {
    const fila = datos[i];
    if (fila && fila.length > 0) {
      const textoFila = fila.join(' ').toUpperCase();
      if (textoFila.includes('MATERIA') || textoFila.includes('FECHA') || textoFila.includes('CARRERA')) {
        indiceCabeceras = i;
        break;
      }
    }
  }

  const cabeceras = datos[indiceCabeceras] || [];
  const filasMaterias = datos.slice(indiceCabeceras + 1);
  
  console.log(`📋 Cabeceras encontradas en fila ${indiceCabeceras + 1}:`, cabeceras);
  console.log(`📝 Procesando ${filasMaterias.length} filas de datos`);

  // Detectar índices de columnas dinámicamente
  const indices = detectarIndicesColumnas(cabeceras);

  const materias = [];

  for (let i = 0; i < filasMaterias.length; i++) {
    const fila = filasMaterias[i];
    
    // Filtrar filas completamente vacías o con solo espacios
    if (!fila || fila.length === 0) continue;
    
    // Verificar si la fila tiene contenido real (no solo espacios o valores vacíos)
    const tieneContenidoReal = fila.some(celda => 
      celda && 
      typeof celda === 'string' && 
      celda.trim().length > 0 && 
      !celda.includes('#REF') && 
      !celda.includes('#N/A') &&
      !celda.includes('#ERROR') &&
      !celda.includes('#VALUE') &&
      !celda.includes('#DIV/0') &&
      !celda.includes('#NAME') &&
      !celda.includes('#NULL')
    );
    
    if (!tieneContenidoReal) {
      console.log(`❌ Fila ${i + 1} ignorada: sin contenido real`);
      continue;
    }

    // Mapeo dinámico basado en los índices detectados
    const materia = {
      id: `${nombreCarrera}-${i}`,
      nombre: indices.nombre >= 0 ? (fila[indices.nombre] || '').toString().trim() : '',
      fecha: indices.fecha >= 0 ? (fila[indices.fecha] || '').toString().trim() : '',
      hora: indices.hora >= 0 ? (fila[indices.hora] || '').toString().trim() : '',
      tipoExamen: indices.tipoExamen >= 0 ? (fila[indices.tipoExamen] || '').toString().trim() : '',
      monitoreo: indices.monitoreo >= 0 ? (fila[indices.monitoreo] || '').toString().trim() : '',
      materialPermitido: indices.material >= 0 ? (fila[indices.material] || '').toString().trim() : '',
      observaciones: indices.observaciones >= 0 ? (fila[indices.observaciones] || '').toString().trim() : ''
    };

    console.log(`🔍 Fila ${i + 1} - Mapeo dinámico:`);
    console.log(`   Nombre (col ${indices.nombre}): "${materia.nombre}"`);
    console.log(`   Fecha (col ${indices.fecha}): "${materia.fecha}"`);
    console.log(`   Hora (col ${indices.hora}): "${materia.hora}"`);
    console.log(`   Tipo (col ${indices.tipoExamen}): "${materia.tipoExamen}"`);
    console.log(`   Monitoreo (col ${indices.monitoreo}): "${materia.monitoreo}"`);

    // Si algunos campos importantes no se detectaron, intentar mapeo adicional
    if (!materia.hora || !materia.tipoExamen || !materia.monitoreo) {
      console.log(`🔧 Intentando mapeo adicional para campos faltantes...`);
      
      // Buscar en las columnas restantes
      for (let j = 0; j < fila.length; j++) {
        if (!fila[j]) continue;
        
        const valor = fila[j].toString().trim();
        if (valor.length === 0 || valor.includes('#')) continue;
        
        // Si ya está mapeado en los índices principales, saltarlo
        if (j === indices.nombre || j === indices.fecha) continue;
        
        // Detectar hora (formato XX:XX)
        if (!materia.hora && /^\d{1,2}:\d{2}$/.test(valor)) {
          materia.hora = valor;
          console.log(`   🕐 Hora detectada en col ${j}: "${valor}"`);
        }
        // Detectar tipo de examen
        else if (!materia.tipoExamen && /oral|escrito|virtual|presencial/i.test(valor)) {
          materia.tipoExamen = valor;
          console.log(`   📝 Tipo examen detectado en col ${j}: "${valor}"`);
        }
        // Detectar monitoreo
        else if (!materia.monitoreo && (/proctoring|monitoreo/i.test(valor) || valor === '---' || valor === '-------')) {
          materia.monitoreo = valor;
          console.log(`   👁️ Monitoreo detectado en col ${j}: "${valor}"`);
        }
        // Detectar material
        else if (!materia.materialPermitido && /permitido|calculadora|material/i.test(valor)) {
          materia.materialPermitido = valor;
          console.log(`   📋 Material detectado en col ${j}: "${valor}"`);
        }
        // Observaciones (resto que no se clasifica)
        else if (valor.length > 1 && 
                 !valor.includes('#') && 
                 !/^[0-9]+$/.test(valor) && // No solo números
                 !/^[A-Z]$/.test(valor)) {   // No solo letras
          if (materia.observaciones) {
            materia.observaciones += ' | ' + valor;
          } else {
            materia.observaciones = valor;
          }
          console.log(`   📄 Observación detectada en col ${j}: "${valor}"`);
        }
      }
    }

    // Validación temprana del nombre de materia
    if (!materia.nombre || 
        materia.nombre.length < 3 || 
        materia.nombre.includes('#') ||
        /^[0-9]+$/.test(materia.nombre) || // Solo números
        /^[A-Z]$/.test(materia.nombre) ||  // Solo una letra
        materia.nombre.toLowerCase() === 'materia' || // Header repetido
        materia.nombre.toLowerCase() === 'asignatura') {
      console.log(`❌ Fila ${i + 1} ignorada: nombre inválido "${materia.nombre}"`);
      continue;
    }

    // Validación temprana de la fecha
    if (!materia.fecha || 
        materia.fecha.length < 4 || 
        materia.fecha.includes('#') ||
        materia.fecha.toLowerCase() === 'fecha') { // Header repetido
      console.log(`❌ Fila ${i + 1} ignorada: fecha inválida "${materia.fecha}"`);
      continue;
    }

    // Validación final más estricta
    if (materia.nombre && 
        materia.nombre.length >= 3 && 
        !materia.nombre.includes('#') &&
        materia.fecha && 
        materia.fecha.length >= 4 && 
        !materia.fecha.includes('#') &&
        // Verificar que no sea solo números o caracteres especiales
        /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(materia.nombre)) {
      
      materias.push(materia);
      console.log(`✅ Materia válida: "${materia.nombre}" - "${materia.fecha}" (Detección dinámica)`);
    } else {
      console.log(`❌ Fila ${i + 1} falló validación final: "${materia.nombre}" | "${materia.fecha}"`);
    }
  }

  console.log(`📚 Total materias válidas para ${nombreCarrera}: ${materias.length} (de ${filasMaterias.length} filas procesadas)`);
  return materias;
} 