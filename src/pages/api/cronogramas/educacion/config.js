// Configuración para Facultad de Educación
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('educacion');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-educacion',
      email: 'educacion@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268580',
        coordinacion: '+54 387 4268581'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Educación de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 