// Módulo compartido para procesamiento de cronogramas de exámenes
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { parse } from 'csv-parse/sync';

export class ProcesadorCronogramas {
  constructor(facultadConfig) {
    this.config = facultadConfig;
    this.outputDir = `./descargas_csv/${this.config.id}`;
    this.cacheFile = path.join(this.outputDir, 'cache_examenes.json');
  }

  // Verificar si una fecha es válida según configuración
  esFechaValida(fechaString) {
    if (!fechaString || fechaString.trim() === '') return false;
    
    try {
      const [dia, mes, año] = fechaString.split('/').map(num => parseInt(num));
      const fechaExamen = new Date(año, mes - 1, dia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Aplicar filtro según configuración
      switch (this.config.procesamiento.filtrarFechasDesde) {
        case 'ayer':
          const ayer = new Date(hoy);
          ayer.setDate(ayer.getDate() - 1);
          return fechaExamen >= ayer;
        case 'semana':
          const hace7Dias = new Date(hoy);
          hace7Dias.setDate(hace7Dias.getDate() - 7);
          return fechaExamen >= hace7Dias;
        case 'hoy':
        default:
          return fechaExamen >= hoy;
      }
    } catch (error) {
      return false;
    }
  }

  // Formatear fecha para diferentes representaciones
  formatearFecha(fechaString) {
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
        }),
        timestamp: fecha.getTime()
      };
    } catch (error) {
      return {
        original: fechaString,
        iso: null,
        legible: fechaString,
        timestamp: null
      };
    }
  }

  // Extraer información de facultad y códigos de carreras
  extraerInfoFacultad() {
    const contenidoPath = path.join(this.outputDir, this.config.procesamiento.archivoContenido);
    if (!fs.existsSync(contenidoPath)) {
      console.warn(`⚠️ No se encontró ${this.config.procesamiento.archivoContenido}`);
      return { facultad: null, carreras: [] };
    }

    const contenido = fs.readFileSync(contenidoPath, 'utf-8');
    const lineas = contenido.split('\n').map(linea => linea.trim()).filter(Boolean);
    
    // Extraer nombre de facultad (primera línea que no esté vacía)
    let nombreFacultad = null;
    for (const linea of lineas) {
      if (linea && !linea.match(/^\d+/) && linea.length > 10) {
        nombreFacultad = linea.toUpperCase();
        break;
      }
    }
    
    // Extraer códigos de carreras
    const carreras = [];
    const regex = /^(\d+)\s*-/;
    
    for (const linea of lineas) {
      const match = linea.match(regex);
      if (match) {
        const codigo = match[1];
        const nombre = linea.replace(regex, '').trim();
        carreras.push({
          codigo: codigo,
          nombre: nombre
        });
      }
    }
    
    console.log(`📋 Facultad: ${nombreFacultad || 'No detectada'}`);
    console.log(`📋 Encontradas ${carreras.length} carreras válidas`);
    
    return { 
      facultad: nombreFacultad || this.config.nombre, 
      carreras 
    };
  }

  // Verificar si un archivo corresponde a una carrera válida
  esCarreraValida(nombreArchivo, codigosValidos) {
    const codigosArray = codigosValidos.map(c => c.codigo);
    
    for (const codigo of codigosArray) {
      const patrones = [
        new RegExp(`^${codigo}_`, 'i'),
        new RegExp(`^${codigo}-`, 'i'),
        new RegExp(`_${codigo}_`, 'i'),
        new RegExp(`_${codigo}-`, 'i'),
        new RegExp(`^.*${codigo}[^0-9]`, 'i'),
      ];
      
      if (patrones.some(patron => patron.test(nombreArchivo))) {
        return codigo;
      }
    }
    
    return null;
  }

  // Descargar todos los CSV de Google Sheets
  async descargarDatos() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}?key=${this.config.apiKey}`;
    const res = await fetch(metadataUrl);
    const data = await res.json();

    if (!data.sheets) throw new Error('No se pudo leer la metadata del documento.');

    const hojas = data.sheets.map(sheet => ({
      gid: sheet.properties.sheetId,
      title: sheet.properties.title
    }));

    for (const hoja of hojas) {
      try {
        await this.descargarCSV(hoja.gid, hoja.title);
      } catch (err) {
        console.warn(`⚠️ Error en hoja ${hoja.title}: ${err.message}`);
      }
    }

    console.log('🚀 Descarga completa.');
  }

  // Descargar un CSV específico
  async descargarCSV(gid, title) {
    const cleanTitle = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, '').replace(/\s+/g, '_');
    const url = `https://docs.google.com/spreadsheets/d/${this.config.sheetId}/export?format=csv&gid=${gid}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error(`Error al descargar ${title}: ${res.statusText}`);

    const content = await res.text();
    const filepath = path.join(this.outputDir, `${cleanTitle}.csv`);
    fs.writeFileSync(filepath, content, 'utf-8');

    console.log(`✅ Descargado: ${title}`);
  }

  // Procesar un archivo CSV específico
  procesarArchivo(archivo, codigosValidos) {
    const filepath = path.join(this.outputDir, archivo);
    const contenido = fs.readFileSync(filepath, 'utf-8');

    if (!contenido.trim()) return null;

    const codigoEncontrado = this.esCarreraValida(archivo, codigosValidos);
    if (!codigoEncontrado) return null;

    try {
      // Procesar líneas para encontrar headers
      const lineas = contenido.split('\n').map(linea => linea.trim()).filter(Boolean);
      
      if (lineas.length < 2) return null;
      
      // Buscar headers
      let indiceHeaders = -1;
      for (let i = 0; i < Math.min(3, lineas.length); i++) {
        if (lineas[i].includes('CARRERA') && lineas[i].includes('FECHA')) {
          indiceHeaders = i;
          break;
        }
      }
      
      if (indiceHeaders === -1) return null;
      
      // CSV válido
      const csvValido = [lineas[indiceHeaders], ...lineas.slice(indiceHeaders + 1)].join('\n');
      
      const registros = parse(csvValido, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      if (registros.length === 0) return null;

      // Filtrar válidos
      const registrosFiltrados = registros.filter(registro => {
        const primerCampo = Object.values(registro)[0];
        if (!primerCampo || primerCampo === '#REF!' || primerCampo === 'CARRERA') return false;
        
        const fecha = registro.FECHA || registro.fecha;
        return fecha && this.esFechaValida(fecha);
      });

      if (registrosFiltrados.length === 0) return null;

      // Convertir a formato estructurado
      const examenes = registrosFiltrados.map(registro => ({
        carrera: registro.CARRERA || registro.carrera,
        materia: registro['NOMBRE CORTO'] || registro.materia || 'Sin especificar',
        fecha: this.formatearFecha(registro.FECHA || registro.fecha),
        hora: registro.Hora || registro.hora || 'Sin especificar',
        tipoExamen: registro['Tipo Examen'] || registro.tipo || 'Sin especificar',
        materialPermitido: registro['Material Permitido'] || registro.material || 'Sin especificar',
        observaciones: registro.Observaciones || registro.observaciones || '',
        monitoreo: registro.Monitoreo || registro.monitoreo || '',
        archivo: archivo
      }));

      return {
        codigoCarrera: codigoEncontrado,
        archivo: archivo,
        examenes: examenes
      };

    } catch (err) {
      console.warn(`⚠️ Error procesando ${archivo}: ${err.message}`);
      return null;
    }
  }

  // Verificar cache
  verificarCache() {
    if (!fs.existsSync(this.cacheFile)) {
      return { esValido: false, datos: null };
    }
    
    try {
      const cacheContent = fs.readFileSync(this.cacheFile, 'utf-8');
      const cache = JSON.parse(cacheContent);
      
      const ahora = new Date();
      const ultimaActualizacion = new Date(cache.timestamp);
      const diferenciaMinutos = (ahora - ultimaActualizacion) / (1000 * 60);
      
      const esValido = diferenciaMinutos < this.config.procesamiento.cacheDuracionMinutos;
      
      return {
        esValido,
        datos: cache.datos,
        ultimaActualizacion: ultimaActualizacion.toLocaleString('es-ES'),
        minutosDesdeActualizacion: Math.round(diferenciaMinutos)
      };
    } catch (error) {
      console.warn('⚠️ Error leyendo cache:', error.message);
      return { esValido: false, datos: null };
    }
  }

  // Guardar en cache
  guardarEnCache(datos) {
    const cache = {
      timestamp: new Date().toISOString(),
      datos: datos
    };
    
    fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`💾 Datos guardados en cache: ${this.cacheFile}`);
  }

  // Método principal para obtener datos (con cache)
  async obtenerDatos(forzarActualizacion = false) {
    const cacheInfo = this.verificarCache();
    
    if (!forzarActualizacion && cacheInfo.esValido) {
      console.log(`📦 Usando datos del cache (actualizado: ${cacheInfo.ultimaActualizacion})`);
      return cacheInfo.datos;
    }
    
    console.log('🔄 Actualizando datos...');
    
    // Descargar datos frescos
    await this.descargarDatos();
    
    // Extraer información de facultad y carreras
    const { facultad, carreras } = this.extraerInfoFacultad();
    
    if (carreras.length === 0) {
      throw new Error('No se encontraron carreras válidas');
    }

    // Procesar archivos
    const archivos = fs.readdirSync(this.outputDir).filter(f => 
      f.endsWith('.csv') && f !== this.config.procesamiento.archivoContenido
    );
    
    const resultadosPorCarrera = {};
    let totalExamenes = 0;

    console.log('🔍 Procesando archivos...\n');

    for (const archivo of archivos) {
      const resultado = this.procesarArchivo(archivo, carreras);
      
      if (resultado) {
        const codigo = resultado.codigoCarrera;
        
        if (!resultadosPorCarrera[codigo]) {
          const infoCarrera = carreras.find(c => c.codigo === codigo);
          resultadosPorCarrera[codigo] = {
            codigo: codigo,
            nombre: infoCarrera ? infoCarrera.nombre : 'Nombre no encontrado',
            examenes: [],
            archivosOriginales: []
          };
        }
        
        resultadosPorCarrera[codigo].examenes.push(...resultado.examenes);
        resultadosPorCarrera[codigo].archivosOriginales.push(archivo);
        
        console.log(`✅ ${archivo}: ${resultado.examenes.length} exámenes válidos`);
        totalExamenes += resultado.examenes.length;
      }
    }

    // Ordenar exámenes por fecha
    Object.values(resultadosPorCarrera).forEach(carrera => {
      carrera.examenes.sort((a, b) => {
        const fechaA = new Date(a.fecha.iso + 'T' + (a.hora || '00:00'));
        const fechaB = new Date(b.fecha.iso + 'T' + (b.hora || '00:00'));
        return fechaA - fechaB;
      });
    });

    // Generar resultado final
    const resultadoFinal = {
      facultad: {
        id: this.config.id,
        nombre: facultad,
        nombreCorto: this.config.nombreCorto,
        metadatos: this.config.metadatos
      },
      fechaGeneracion: new Date().toISOString(),
      configuracion: {
        filtrarFechasDesde: this.config.procesamiento.filtrarFechasDesde,
        sheetId: this.config.sheetId
      },
      resumen: {
        totalCarreras: Object.keys(resultadosPorCarrera).length,
        totalExamenes: totalExamenes
      },
      carreras: resultadosPorCarrera
    };

    // Guardar en cache
    this.guardarEnCache(resultadoFinal);

    console.log('\n📊 RESULTADO FINAL:');
    console.log(`✅ ${resultadoFinal.resumen.totalCarreras} carreras con exámenes válidos`);
    console.log(`✅ ${resultadoFinal.resumen.totalExamenes} exámenes totales`);

    return resultadoFinal;
  }
} 