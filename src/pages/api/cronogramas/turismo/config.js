// Configuración para Facultad de Turismo
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('turismo');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-turismo',
      email: 'turismo@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268590',
        coordinacion: '+54 387 4268591'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Turismo de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 