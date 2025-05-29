// Configuración para Facultad de Economía y Administración
import { obtenerConfigFacultad } from '../shared/facultades-config.js';

// Obtener configuración base desde configuración centralizada
const configBase = obtenerConfigFacultad('economia-administracion');

// Metadatos específicos más detallados para esta facultad
export const facultadConfig = {
  ...configBase,
  metadatos: {
    ...configBase.metadatos,
    contacto: {
      web: 'https://www.ucasal.edu.ar/home-facultad-de-economia-y-administracion',
      email: 'economiayadministracion@ucasal.edu.ar',
      telefonos: {
        secretaria: '+54 387 4268518',
        coordinacion: '+54 387 4268520'
      }
    },
    descripcion: 'Cronogramas de exámenes de la Facultad de Economía y Administración de la Universidad Católica de Salta'
  }
};

export default facultadConfig; 