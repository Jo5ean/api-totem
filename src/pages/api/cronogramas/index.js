// Endpoint general para cronogramas - Directorio de facultades
import fs from 'fs';
import path from 'path';
import { obtenerTodasLasFacultades, obtenerFacultadesActivas } from './shared/facultades-config.js';

// Obtener lista de facultades disponibles (verificando archivos)
function obtenerFacultadesDisponibles() {
  const cronogramasDir = path.join(process.cwd(), 'src/pages/api/cronogramas');
  const facultadesConfiguradas = obtenerTodasLasFacultades();
  
  const facultadesConArchivos = [];
  
  for (const facultad of facultadesConfiguradas) {
    const facultadDir = path.join(cronogramasDir, facultad.id);
    const configPath = path.join(facultadDir, 'config.js');
    const indexPath = path.join(facultadDir, 'index.js');
    
    const tieneArchivos = fs.existsSync(configPath) && fs.existsSync(indexPath);
    
    facultadesConArchivos.push({
      ...facultad,
      ruta: `/api/cronogramas/${facultad.id}`,
      disponible: tieneArchivos,
      implementado: tieneArchivos,
      error: tieneArchivos ? null : 'Archivos de configuración no encontrados'
    });
  }
  
  return facultadesConArchivos;
}

export default async function handler(req, res) {
  const { method, query } = req;
  
  try {
    
    if (method === 'GET') {
      const { facultad, combinar, estado } = query;
      
      // Si se especifica una facultad, redirigir
      if (facultad) {
        return res.redirect(307, `/api/cronogramas/${facultad}`);
      }
      
      // Si se solicita combinar todas las facultades
      if (combinar === 'true') {
        // TODO: Implementar combinación de múltiples facultades
        return res.status(501).json({
          success: false,
          error: 'Combinación de facultades no implementada aún',
          mensaje: 'Use endpoints específicos por facultad'
        });
      }
      
      // Obtener facultades según filtro de estado
      let facultades = obtenerFacultadesDisponibles();
      
      if (estado === 'activo') {
        facultades = facultades.filter(f => f.estado === 'activo');
      } else if (estado === 'desarrollo') {
        facultades = facultades.filter(f => f.estado === 'desarrollo');
      }
      
      // Contar estadísticas
      const estadisticas = {
        total: facultades.length,
        activas: facultades.filter(f => f.estado === 'activo').length,
        desarrollo: facultades.filter(f => f.estado === 'desarrollo').length,
        implementadas: facultades.filter(f => f.implementado).length,
        disponibles: facultades.filter(f => f.disponible).length
      };
      
      res.status(200).json({
        success: true,
        mensaje: 'Directorio de cronogramas por facultad - Universidad Nacional del Sur',
        estadisticas,
        facultades,
        filtros: {
          actual: estado || 'todas',
          opciones: ['todas', 'activo', 'desarrollo']
        },
        ejemploUso: {
          facultadActiva: '/api/cronogramas/economia-administracion',
          conParametros: '/api/cronogramas/economia-administracion?force=true',
          soloActivas: '/api/cronogramas?estado=activo',
          soloDesarrollo: '/api/cronogramas?estado=desarrollo',
          combinadas: '/api/cronogramas?combinar=true (próximamente)'
        },
        documentacion: {
          parametros: {
            facultad: 'ID de facultad específica para redireccionar',
            estado: 'activo/desarrollo - Filtrar por estado de implementación',
            combinar: 'true/false - Combinar datos de todas las facultades (próximamente)',
            force: 'true/false - Forzar actualización ignorando cache (en endpoints específicos)'
          },
          estados: {
            activo: 'Facultad completamente funcional',
            desarrollo: 'Facultad en proceso de implementación',
            mantenimiento: 'Facultad temporalmente inactiva'
          },
          cache: 'Los datos se cachean por 30 minutos por defecto en cada facultad',
          formato: 'JSON con estructura estandardizada por facultad'
        },
        universidad: {
          nombre: 'Universidad Nacional del Sur',
          ubicacion: 'Bahía Blanca, Argentina',
          web: 'https://www.uns.edu.ar'
        },
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        success: false,
        error: `Método ${method} no permitido`,
        metodosPermitidos: ['GET']
      });
    }
    
  } catch (error) {
    console.error('Error en cronogramas index:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 