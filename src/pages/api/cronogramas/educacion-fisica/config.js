// Configuración para Escuela Universitaria de Educación Física
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('educacion-fisica');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-escuela-universitaria-de-educacion-fisica',
      email: 'educacionfisica@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268570',
        coordinacion: '+54 387 4268571'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Escuela Universitaria de Educación Física de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 