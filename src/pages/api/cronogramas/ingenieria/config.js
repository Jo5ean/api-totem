// Configuración para Facultad de Ingeniería
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('ingenieria');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  // Configuración específica para Ingeniería (estructura diferente)
  procesamiento: {
    ...configBase.procesamiento,
    archivoContenido: 'CONTENIDO.csv', // ← Sin guiones bajos para Ingeniería
    filtrarFechasDesde: 'ayer' // ← Más permisivo para testing
  },
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-ingenieria',
      email: 'ingenieria@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268500',
        coordinacion: '+54 387 4268501'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Ingeniería de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 