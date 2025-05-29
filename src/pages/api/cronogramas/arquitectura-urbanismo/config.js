// Configuración para Facultad de Arquitectura y Urbanismo
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('arquitectura-urbanismo');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-arquitectura-y-urbanismo',
      email: 'arquitectura@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268560',
        coordinacion: '+54 387 4268561'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Arquitectura y Urbanismo de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 