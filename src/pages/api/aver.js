import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { parse } from 'csv-parse/sync';

const SHEET_ID = '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk';
const API_KEY = 'AIzaSyA3asK3587-fiUgoSWYyOLVbhNfnrD2wIE';

const OUTPUT_DIR = './descargas_csv';
const CACHE_FILE = path.join(OUTPUT_DIR, 'cache_examenes.json');
const CACHE_DURATION_MINUTES = 30; // Actualizar cada 30 minutos

export default async function handler(req, res) {
  try {
    // Si se llama desde la API, devolver datos estructurados (con cache)
    const datosEstructurados = await obtenerDatosConCache();
    res.status(200).json(datosEstructurados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Función principal que maneja el cache
async function obtenerDatosConCache() {
  const cacheInfo = verificarCache();
  
  if (cacheInfo.esValido) {
    console.log(`📦 Usando datos del cache (actualizado: ${cacheInfo.ultimaActualizacion})`);
    return cacheInfo.datos;
  }
  
  console.log('🔄 Cache expirado o inexistente. Actualizando datos...');
  
  // Actualizar datos y guardar en cache
  const datosFrescos = await obtenerDatosFrescos();
  guardarEnCache(datosFrescos);
  
  return datosFrescos;
}

// Función para verificar si el cache es válido
function verificarCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    return { esValido: false, datos: null, ultimaActualizacion: null };
  }
  
  try {
    const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(cacheContent);
    
    const ahora = new Date();
    const ultimaActualizacion = new Date(cache.timestamp);
    const diferenciaMinutos = (ahora - ultimaActualizacion) / (1000 * 60);
    
    const esValido = diferenciaMinutos < CACHE_DURATION_MINUTES;
    
    return {
      esValido,
      datos: cache.datos,
      ultimaActualizacion: ultimaActualizacion.toLocaleString('es-ES'),
      minutosDesdeActualizacion: Math.round(diferenciaMinutos)
    };
  } catch (error) {
    console.warn('⚠️ Error leyendo cache:', error.message);
    return { esValido: false, datos: null, ultimaActualizacion: null };
  }
}

// Función para guardar datos en cache
function guardarEnCache(datos) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const cache = {
    timestamp: new Date().toISOString(),
    datos: datos
  };
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  console.log(`💾 Datos guardados en cache: ${CACHE_FILE}`);
}

// Función para obtener datos frescos (descarga + procesamiento)
async function obtenerDatosFrescos() {
  // Asegurar que tenemos los datos más recientes
  await actualizarDatos();
  
  // Procesar y filtrar datos
  const datosRelevantes = procesarCSVConFiltrado();
  
  return {
    fechaActualizacion: new Date().toISOString(),
    totalCarreras: Object.keys(datosRelevantes).length,
    cacheInfo: {
      duracionCacheMinutos: CACHE_DURATION_MINUTES,
      proximaActualizacion: new Date(Date.now() + CACHE_DURATION_MINUTES * 60 * 1000).toISOString()
    },
    carreras: datosRelevantes
  };
}

// Función para forzar actualización (útil para testing)
async function forzarActualizacion() {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
    console.log('🗑️ Cache eliminado. Forzando actualización...');
  }
  return await obtenerDatosConCache();
}

// Función para verificar si una fecha es desde hoy en adelante
function esFechaValida(fechaString) {
  if (!fechaString || fechaString.trim() === '') return false;
  
  try {
    // Convertir fecha del formato DD/MM/YYYY o D/M/YYYY
    const [dia, mes, año] = fechaString.split('/').map(num => parseInt(num));
    const fechaExamen = new Date(año, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
    
    // Incluir fechas de hoy en adelante (>= en lugar de >)
    const esValida = fechaExamen >= hoy;
    
    // Debug temporal
    if (fechaString === '29/5/2025' || fechaString === '28/5/2025' || fechaString === '26/5/2025') {
      console.log(`🔍 DEBUG fecha: ${fechaString} -> ${fechaExamen.toLocaleDateString('es-ES')} vs ${hoy.toLocaleDateString('es-ES')} = ${esValida}`);
    }
    
    return esValida;
  } catch (error) {
    console.warn(`⚠️ Fecha inválida: ${fechaString}`);
    return false;
  }
}

// Función para formatear fecha
function formatearFecha(fechaString) {
  try {
    const [dia, mes, año] = fechaString.split('/').map(num => parseInt(num));
    const fecha = new Date(año, mes - 1, dia);
    return {
      original: fechaString,
      iso: fecha.toISOString().split('T')[0],
      legible: fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  } catch (error) {
    return {
      original: fechaString,
      iso: null,
      legible: fechaString
    };
  }
}

async function obtenerHojas() {
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`;
  const res = await fetch(metadataUrl);
  const data = await res.json();

  if (!data.sheets) throw new Error('No se pudo leer la metadata del documento.');

  return data.sheets.map(sheet => ({
    gid: sheet.properties.sheetId,
    title: sheet.properties.title
  }));
}

async function descargarCSV(gid, title) {
  const cleanTitle = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Error al descargar ${title}: ${res.statusText}`);

  const content = await res.text();

  const filepath = path.join(OUTPUT_DIR, `${cleanTitle}.csv`);
  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`✅ Descargado: ${title}`);
}

// Función para extraer códigos de carrera del archivo _CONTENIDO_.csv
function extraerCodigosCarreras() {
  const contenidoPath = path.join(OUTPUT_DIR, '_CONTENIDO_.csv');
  if (!fs.existsSync(contenidoPath)) {
    console.warn('⚠️ No se encontró _CONTENIDO_.csv');
    return [];
  }

  const contenido = fs.readFileSync(contenidoPath, 'utf-8');
  const lineas = contenido.split('\n').map(linea => linea.trim()).filter(Boolean);
  
  const codigos = [];
  const regex = /^(\d+)\s*-/; // Busca líneas que empiecen con número seguido de guión
  
  for (const linea of lineas) {
    const match = linea.match(regex);
    if (match) {
      const codigo = match[1];
      const nombre = linea.replace(regex, '').trim();
      codigos.push({
        codigo: codigo,
        nombre: nombre,
        linea: linea
      });
    }
  }
  
  console.log(`📋 Encontrados ${codigos.length} códigos de carreras en _CONTENIDO_.csv`);
  
  return codigos;
}

// Función para verificar si un archivo CSV corresponde a una carrera válida
function esCarreraValida(nombreArchivo, codigosValidos) {
  const codigosArray = codigosValidos.map(c => c.codigo);
  
  // Buscar si el nombre del archivo contiene algún código válido
  for (const codigo of codigosArray) {
    // Verificar diferentes patrones posibles en el nombre del archivo
    const patrones = [
      new RegExp(`^${codigo}_`, 'i'),           // Empieza con código_
      new RegExp(`^${codigo}-`, 'i'),           // Empieza con código-
      new RegExp(`_${codigo}_`, 'i'),           // Contiene _código_
      new RegExp(`_${codigo}-`, 'i'),           // Contiene _código-
      new RegExp(`^.*${codigo}[^0-9]`, 'i'),    // Contiene código seguido de no-número
    ];
    
    if (patrones.some(patron => patron.test(nombreArchivo))) {
      return codigo;
    }
  }
  
  return null;
}

// Función principal para actualizar datos
async function actualizarDatos() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const hojas = await obtenerHojas();

  for (const hoja of hojas) {
    try {
      await descargarCSV(hoja.gid, hoja.title);
    } catch (err) {
      console.warn(`⚠️ Error en hoja ${hoja.title}: ${err.message}`);
    }
  }

  console.log('🚀 Descarga completa.');
}

// Función mejorada para procesar CSV con filtrado por fechas
function procesarCSVConFiltrado() {
  // Extraer códigos válidos del archivo _CONTENIDO_.csv
  const codigosValidos = extraerCodigosCarreras();
  
  if (codigosValidos.length === 0) {
    console.warn('⚠️ No se encontraron códigos válidos en _CONTENIDO_.csv');
    return {};
  }

  const archivos = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.csv') && f !== '_CONTENIDO_.csv');
  const datosRelevantes = {};
  const hoy = new Date();

  console.log(`\n🔍 Procesando archivos CSV... (Filtrar desde: ${hoy.toLocaleDateString('es-ES')})\n`);

  for (const archivo of archivos) {
    const filepath = path.join(OUTPUT_DIR, archivo);
    const contenido = fs.readFileSync(filepath, 'utf-8');

    if (!contenido.trim()) {
      fs.unlinkSync(filepath);
      console.log(`🗑️ Eliminado vacío: ${archivo}`);
      continue;
    }

    // Verificar si el archivo corresponde a una carrera válida
    const codigoEncontrado = esCarreraValida(archivo, codigosValidos);
    
    if (!codigoEncontrado) {
      continue; // Ignorar archivos no válidos silenciosamente
    }

    try {
      // Procesar CSV línea por línea para manejar headers incorrectos
      const lineas = contenido.split('\n').map(linea => linea.trim()).filter(Boolean);
      
      if (lineas.length < 2) {
        console.log(`⚠️ Archivo muy corto: ${archivo}`);
        continue;
      }
      
      // Buscar la línea de headers (la que contiene "CARRERA" o "FECHA")
      let indiceHeaders = -1;
      for (let i = 0; i < Math.min(3, lineas.length); i++) {
        if (lineas[i].includes('CARRERA') && lineas[i].includes('FECHA')) {
          indiceHeaders = i;
          break;
        }
      }
      
      if (indiceHeaders === -1) {
        console.log(`⚠️ No se encontraron headers válidos en: ${archivo}`);
        continue;
      }
      
      // Crear contenido CSV válido (headers + datos)
      const csvValido = [lineas[indiceHeaders], ...lineas.slice(indiceHeaders + 1)].join('\n');
      
      const registros = parse(csvValido, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (registros.length === 0) {
        console.log(`🗑️ Sin datos útiles: ${archivo}`);
        continue;
      }

      // Debug: mostrar estructura del primer registro
      if (registros.length > 0) {
        const primerRegistro = registros[0];
        console.log(`\n📋 Archivo: ${archivo} - Campos disponibles:`, Object.keys(primerRegistro));
      }

      // Filtrar registros válidos (que no sean #REF! y tengan fechas válidas)
      const registrosFiltrados = registros.filter(registro => {
        // Verificar que no sea un registro de error
        const primerCampo = Object.values(registro)[0];
        if (!primerCampo || primerCampo === '#REF!' || primerCampo === 'CARRERA') return false;
        
        // Verificar que tenga fecha válida (desde hoy en adelante)
        const fecha = registro.FECHA || registro.fecha;
        if (!fecha) {
          console.log(`⚠️ Registro sin fecha en ${archivo}:`, registro);
          return false;
        }
        
        const fechaValida = esFechaValida(fecha);
        if (fechaValida) {
          console.log(`✅ Fecha válida encontrada: ${fecha} en ${archivo}`);
        }
        return fechaValida;
      });

      if (registrosFiltrados.length === 0) {
        console.log(`⏰ Sin exámenes próximos en: ${archivo}`);
        continue;
      }

      // Buscar información de la carrera
      const infoCarrera = codigosValidos.find(c => c.codigo === codigoEncontrado);
      
      if (!datosRelevantes[codigoEncontrado]) {
        datosRelevantes[codigoEncontrado] = {
          codigo: codigoEncontrado,
          nombre: infoCarrera ? infoCarrera.nombre : 'Nombre no encontrado',
          examenes: [],
          resumen: {
            totalExamenes: 0,
            fechas: [],
            tiposExamen: new Set(),
            materiasUnicas: new Set()
          }
        };
      }
      
      // Procesar cada registro válido
      registrosFiltrados.forEach(registro => {
        const examen = {
          carrera: registro.CARRERA || registro.carrera,
          materia: registro['NOMBRE CORTO'] || registro.materia || 'Sin especificar',
          fecha: formatearFecha(registro.FECHA || registro.fecha),
          hora: registro.Hora || registro.hora || 'Sin especificar',
          tipoExamen: registro['Tipo Examen'] || registro.tipo || 'Sin especificar',
          materialPermitido: registro['Material Permitido'] || registro.material || 'Sin especificar',
          observaciones: registro.Observaciones || registro.observaciones || '',
          monitoreo: registro.Monitoreo || registro.monitoreo || '',
          archivo: archivo
        };

        datosRelevantes[codigoEncontrado].examenes.push(examen);
        
        // Actualizar resumen
        datosRelevantes[codigoEncontrado].resumen.totalExamenes++;
        if (!datosRelevantes[codigoEncontrado].resumen.fechas.includes(examen.fecha.iso)) {
          datosRelevantes[codigoEncontrado].resumen.fechas.push(examen.fecha.iso);
        }
        datosRelevantes[codigoEncontrado].resumen.tiposExamen.add(examen.tipoExamen);
        datosRelevantes[codigoEncontrado].resumen.materiasUnicas.add(examen.materia);
      });

      console.log(`✅ Procesados ${registrosFiltrados.length} exámenes válidos de ${archivo}`);

    } catch (err) {
      console.warn(`⚠️ Error procesando ${archivo}: ${err.message}`);
    }
  }

  // Convertir Sets a Arrays y ordenar fechas
  Object.values(datosRelevantes).forEach(carrera => {
    carrera.resumen.tiposExamen = Array.from(carrera.resumen.tiposExamen);
    carrera.resumen.materiasUnicas = Array.from(carrera.resumen.materiasUnicas);
    carrera.resumen.fechas.sort();
    
    // Ordenar exámenes por fecha y hora
    carrera.examenes.sort((a, b) => {
      const fechaA = new Date(a.fecha.iso + 'T' + (a.hora || '00:00'));
      const fechaB = new Date(b.fecha.iso + 'T' + (b.hora || '00:00'));
      return fechaA - fechaB;
    });
  });

  // Mostrar resumen en consola
  console.log('\n📊 RESUMEN DE EXÁMENES PRÓXIMOS:\n');
  console.log('='.repeat(80));

  let totalExamenes = 0;
  for (const [codigo, data] of Object.entries(datosRelevantes)) {
    totalExamenes += data.resumen.totalExamenes;
    console.log(`\n🎓 CARRERA ${codigo}: ${data.nombre}`);
    console.log(`📅 Exámenes próximos: ${data.resumen.totalExamenes}`);
    console.log(`📆 Fechas: ${data.resumen.fechas.join(', ')}`);
    console.log(`📝 Materias: ${data.resumen.materiasUnicas.slice(0, 3).join(', ')}${data.resumen.materiasUnicas.length > 3 ? '...' : ''}`);
  }

  console.log(`\n✅ Total de exámenes próximos: ${totalExamenes} en ${Object.keys(datosRelevantes).length} carreras`);
  console.log('='.repeat(80));

  return datosRelevantes;
}

// Función de compatibilidad para ejecutar desde terminal
async function main() {
  const modoForzar = process.argv.includes('--force') || process.argv.includes('-f');
  
  let datosEstructurados;
  if (modoForzar) {
    console.log('🔄 Modo FORZAR activado. Ignorando cache...');
    datosEstructurados = await forzarActualizacion();
  } else {
    datosEstructurados = await obtenerDatosConCache();
  }
  
  // También guardar una copia legacy en JSON para compatibilidad
  const resultadoPath = path.join(OUTPUT_DIR, 'examenes_proximos.json');
  fs.writeFileSync(resultadoPath, JSON.stringify(datosEstructurados, null, 2), 'utf-8');
  console.log(`\n💾 Copia legacy guardada en: ${resultadoPath}`);
  
  return datosEstructurados;
}

// Solo ejecutar main() si se llama directamente desde terminal
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}