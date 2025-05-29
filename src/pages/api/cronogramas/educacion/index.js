// Endpoint para cronogramas de la Facultad de Educación
import { facultadConfig } from './config.js';
import { ProcesadorCronogramas } from '../shared/procesador.js';

export default async function handler(req, res) {
  try {
    const { force } = req.query;
    const forzarActualizacion = force === 'true' || force === '1';
    
    const procesador = new ProcesadorCronogramas(facultadConfig);
    const datos = await procesador.obtenerDatos(forzarActualizacion);
    
    // Agregar headers útiles para el frontend
    res.setHeader('Cache-Control', `s-maxage=${facultadConfig.procesamiento.cacheDuracionMinutos * 60}, stale-while-revalidate`);
    res.setHeader('X-Facultad-Id', facultadConfig.id);
    res.setHeader('X-Facultad-Nombre', encodeURIComponent(facultadConfig.nombre));
    
    res.status(200).json({
      success: true,
      ...datos
    });
    
  } catch (error) {
    console.error('Error en cronogramas educacion:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      facultad: {
        id: facultadConfig.id,
        nombre: facultadConfig.nombre
      },
      timestamp: new Date().toISOString()
    });
  }
} 