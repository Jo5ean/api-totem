import React, { useState, useMemo } from 'react';

/**
 * Componente de tabla para mostrar los cronogramas de exámenes
 */
export default function CronogramaTable({ cronogramas, loading = false }) {
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;

  // Filtrar registros vacíos o incompletos
  const cronogramasValidos = useMemo(() => {
    if (!cronogramas) return [];
    
    return cronogramas.filter(cronograma => {
      // Verificar que tenga al menos materia o algún campo importante
      const tieneMateria = cronograma.materia && 
                          cronograma.materia.trim() !== '' && 
                          cronograma.materia.toLowerCase() !== 'desconocido';
      
      const tieneFecha = cronograma.fecha && 
                        cronograma.fecha.trim() !== '';
      
      // Excluir registros que solo tienen "carrera: desconocido"
      const tieneCarreraValida = cronograma.carrera && 
                                cronograma.carrera !== 'desconocido';
      
      return tieneMateria || (tieneFecha && tieneCarreraValida);
    });
  }, [cronogramas]);

  // Cálculos de paginación
  const totalPaginas = Math.ceil(cronogramasValidos.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const registrosPaginaActual = cronogramasValidos.slice(indiceInicio, indiceFin);

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return fecha;
  };

  // Combinar fecha y hora para mostrar
  const formatearFechaHora = (fecha, hora) => {
    if (!fecha) return '-';
    return `${fecha} - ${hora || ''}`;
  };

  // Función para cambiar página
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Si está cargando, mostrar estado de carga
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ucasal-blue mb-4"></div>
          <p className="text-gray-500">Cargando cronogramas...</p>
        </div>
      </div>
    );
  }

  // Si no hay datos válidos, mostrar mensaje
  if (!cronogramasValidos || cronogramasValidos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500">No se encontraron cronogramas válidos con los criterios seleccionados</p>
          <p className="text-xs text-gray-400 mt-2">
            Se filtraron {cronogramas ? cronogramas.length - cronogramasValidos.length : 0} registros vacíos o incompletos
          </p>
        </div>
      </div>
    );
  }

  // Renderizar tabla con datos y paginación
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Información de registros */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{' '}
            <span className="font-medium">{Math.min(indiceFin, cronogramasValidos.length)}</span> de{' '}
            <span className="font-medium">{cronogramasValidos.length}</span> cronogramas válidos
          </p>
          {cronogramas && cronogramas.length !== cronogramasValidos.length && (
            <p className="text-xs text-orange-600">
              Se ocultaron {cronogramas.length - cronogramasValidos.length} registros vacíos
            </p>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Examen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitoreo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material Permitido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrosPaginaActual.map((cronograma) => (
              <tr key={cronograma.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{cronograma.materia || 'Sin especificar'}</div>
                  <div className="text-sm text-gray-500">
                    Carrera: {cronograma.origenPestaña || cronograma.carrera || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatearFechaHora(cronograma.fecha, cronograma.hora)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cronograma.tipoExamen || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cronograma.monitoreo || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cronograma.materialPermitido || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-ucasal-blue hover:text-blue-900 mr-3">
                    Ver
                  </button>
                  <button className="text-gray-600 hover:text-gray-900 mr-3">
                    Editar
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    Aula
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{paginaActual}</span> de{' '}
                  <span className="font-medium">{totalPaginas}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Números de página */}
                  {[...Array(Math.min(5, totalPaginas))].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => cambiarPagina(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === paginaActual
                            ? 'z-10 bg-ucasal-blue border-ucasal-blue text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 