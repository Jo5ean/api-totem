// Configuración centralizada de todas las facultades

/**
 * ESTRUCTURA ESTÁNDAR DE METADATOS POR FACULTAD:
 * 
 * metadatos: {
 *   ...configBase.metadatos,               // ← Universidad, ubicación, web
 *   contacto: {
 *     web: 'URL específica de la facultad',
 *     email: 'email@facultad.ucasal.edu.ar',
 *     telefonos: {
 *       secretaria: '+54 387 42685XX',
 *       coordinacion: '+54 387 42685XX'
 *     }
 *   },
 *   descripcion: 'Descripción específica de la facultad'
 * }
 * 
 * NOTA: NO incluir especialidades ni codigosCarrera estáticos.
 * Estos datos se extraen dinámicamente del procesamiento de CSVs 
 * para evitar inconsistencias cuando se agregan nuevas carreras.
 */

export const FACULTADES_DISPONIBLES = {
  'economia-administracion': {
    id: 'economia-administracion',
    nombre: 'Facultad de Economía y Administración',
    nombreCorto: 'FEA',
    sheetId: '1NVGjcJFoJigektPblUdHuzGqVsY7PiD-hZuLBqe4MNk',
    estado: 'activo'
  },
  'ciencias-juridicas': {
    id: 'ciencias-juridicas',
    nombre: 'Facultad de Ciencias Jurídicas',
    nombreCorto: 'FCJ',
    sheetId: '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc',
    estado: 'activo'
  },
  'arquitectura-urbanismo': {
    id: 'arquitectura-urbanismo',
    nombre: 'Facultad de Arquitectura y Urbanismo',
    nombreCorto: 'FAU',
    sheetId: '1xJBRTnfNMlcfGHLo_9y96taH5JCNdlIw_fYiuAIy7kQ',
    estado: 'activo'
  },
  'educacion-fisica': {
    id: 'educacion-fisica',
    nombre: 'Escuela Universitaria de Educación Física',
    nombreCorto: 'EUEF',
    sheetId: '1cUk1wAObM1u0ErEIh98XXz6NTxGcKLVt3orJczSgCAU',
    estado: 'activo'
  },
  'educacion': {
    id: 'educacion',
    nombre: 'Facultad de Educación',
    nombreCorto: 'FE',
    sheetId: '1G2gL5bqy85gE5mOGTTlN7PPTAbKoeIcDYJineSPqut0',
    estado: 'activo'
  },
  'ingenieria': {
    id: 'ingenieria',
    nombre: 'Facultad de Ingeniería',
    nombreCorto: 'FI',
    sheetId: '10-IUeW-NZMvZkwwxxjspdNG9-jbBvtXhgWG3Bcwxqr0',
    estado: 'activo'
  },
  'turismo': {
    id: 'turismo',
    nombre: 'Facultad de Turismo',
    nombreCorto: 'FT',
    sheetId: '1saPHBuYV0L6_NN1mcsEABIDCKa2SXINMYK2sZIsOxwo',
    estado: 'activo'
  }
};

// Configuración base compartida para todas las facultades
export const CONFIG_BASE = {
  apiKey: 'AIzaSyA3asK3587-fiUgoSWYyOLVbhNfnrD2wIE', // Usar directamente para debugging
  procesamiento: {
    archivoContenido: '_CONTENIDO_.csv',
    cacheDuracionMinutos: 30,
    filtrarFechasDesde: 'hoy'
  },
  metadatosUniversidad: {
    universidad: 'Universidad Católica de Salta',
    ubicacion: 'Salta, Argentina',
    web: 'https://www.ucasal.edu.ar',
    descripcionGeneral: 'Cronogramas de exámenes de la Universidad Católica de Salta'
  }
};

// Función para obtener configuración completa de una facultad
export function obtenerConfigFacultad(facultadId) {
  const facultad = FACULTADES_DISPONIBLES[facultadId];
  
  if (!facultad) {
    throw new Error(`Facultad "${facultadId}" no encontrada`);
  }
  
  return {
    ...facultad,
    ...CONFIG_BASE,
    metadatos: {
      ...CONFIG_BASE.metadatosUniversidad,
      contacto: {
        web: `https://www.ucasal.edu.ar/home-facultad-de-${facultadId.replace('-', '-')}`,
        email: `${facultadId.replace('-', '')}@ucasal.edu.ar`
      },
      descripcion: `Cronogramas de exámenes de la ${facultad.nombre} de la Universidad Católica de Salta`
    }
  };
}

// Función para listar facultades activas
export function obtenerFacultadesActivas() {
  return Object.values(FACULTADES_DISPONIBLES).filter(f => f.estado === 'activo');
}

// Función para listar todas las facultades
export function obtenerTodasLasFacultades() {
  return Object.values(FACULTADES_DISPONIBLES);
}

export default {
  FACULTADES_DISPONIBLES,
  CONFIG_BASE,
  obtenerConfigFacultad,
  obtenerFacultadesActivas,
  obtenerTodasLasFacultades
}; 