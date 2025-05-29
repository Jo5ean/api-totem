// Configuración para Facultad de Ciencias Jurídicas
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('ciencias-juridicas');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-ciencias-juridicas',
      email: 'cienciasjuridicas@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268550',
        coordinacion: '+54 387 4268551'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Ciencias Jurídicas de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 