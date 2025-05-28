import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Link from 'next/link';
import CronogramaTable from '../../components/CronogramaTable';
import TabNavigation from '../../components/TabNavigation';

export default function Cronogramas() {
  // Estados para datos
  const [facultades, setFacultades] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [materiasActuales, setMateriasActuales] = useState([]);
  const [facultadActiva, setFacultadActiva] = useState(null);
  const [carreraActiva, setCarreraActiva] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para la fecha de última actualización (evita problemas de hidratación)
  const [fechaActualizacion, setFechaActualizacion] = useState('');
  
  // Estado para almacenar todos los datos del endpoint
  const [datosCompletos, setDatosCompletos] = useState(null);

  const SHEET_ID = '14_ODC3bZL4EarjzG62M9TpNdiXNUYG8aymy1QsHu_qc';
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

  const cargarFacultadesYCarreras = async () => {
    setCargando(true);
    setError(null);
    
    try {
      console.log('🧪 Probando endpoint de test primero...');
      
      // Primero hacer test para ver qué facultades funcionan
      const testResponse = await fetch(`/api/test-facultades?apiKey=${API_KEY}`);
      const testData = await testResponse.json();
      
      console.log('📋 Resultados del test:', testData);
      
      if (!testResponse.ok) {
        throw new Error('Error en test de facultades');
      }

      // Filtrar solo las facultades que funcionan
      const facultadesFuncionando = testData.resultados.filter(r => r.status.includes('✅'));
      
      if (facultadesFuncionando.length === 0) {
        throw new Error('No hay facultades disponibles en este momento');
      }

      console.log(`✅ Facultades funcionando: ${facultadesFuncionando.length}`);

      // Crear estructura simplificada para el frontend
      const facultadesArray = facultadesFuncionando.map(facultadTest => ({
        nombre: facultadTest.nombre,
        carreras: [], // Las cargaremos después
        status: facultadTest.status,
        totalHojas: facultadTest.hojasCarreras
      }));

      setFacultades(facultadesArray);
      
      // Seleccionar primera facultad por defecto
      if (facultadesArray.length > 0) {
        const primeraFacultad = facultadesArray[0];
        setFacultadActiva(primeraFacultad.nombre);
        
        // Cargar datos de la primera facultad
        await cargarDatosFacultad(primeraFacultad.nombre);
      }

    } catch (err) {
      setError(err.message);
      console.error('❌ Error:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarDatosFacultad = async (nombreFacultad) => {
    console.log(`📚 Cargando datos de ${nombreFacultad}...`);
    
    try {
      // Llamar al endpoint específico de la facultad
      const response = await fetch(`/api/cronogramas?facultad=${encodeURIComponent(nombreFacultad)}&apiKey=${API_KEY}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cargar facultad');
      }

      console.log(`📋 Datos de ${nombreFacultad}:`, data);

      // Filtrar y procesar carreras válidas
      const carrerasValidas = (data.carreras || [])
        .filter(carrera => {
          // Verificar que la carrera tenga materias válidas
          const materiasValidas = (carrera.materias || []).filter(materia => 
            materia.nombre && 
            materia.nombre.trim().length > 0 &&
            !materia.nombre.includes('#') &&
            materia.fecha && 
            materia.fecha.trim().length > 0 &&
            !materia.fecha.includes('#')
          );
          
          return materiasValidas.length > 0;
        })
        .map(carrera => ({
          // Estructura compatible con TabNavigation
          id: carrera.nombre,
          nombre: carrera.nombre,
          title: carrera.nombre,
          codigo: carrera.codigo,
          materias: (carrera.materias || []).filter(materia => 
            materia.nombre && 
            materia.nombre.trim().length > 0 &&
            !materia.nombre.includes('#') &&
            materia.fecha && 
            materia.fecha.trim().length > 0 &&
            !materia.fecha.includes('#')
          )
        }));

      console.log(`📊 ${nombreFacultad}: ${carrerasValidas.length} carreras válidas (de ${data.carreras?.length || 0} originales)`);

      // Actualizar carreras para esta facultad
      setCarreras(carrerasValidas);
      
      // Actualizar facultades con las carreras cargadas
      setFacultades(prev => prev.map(fac => 
        fac.nombre === nombreFacultad 
          ? { ...fac, carreras: carrerasValidas }
          : fac
      ));

      // Seleccionar primera carrera por defecto si hay carreras válidas
      if (carrerasValidas.length > 0) {
        const primeraCarrera = carrerasValidas[0];
        setCarreraActiva(primeraCarrera.id);
        setMateriasActuales(primeraCarrera.materias || []);
        console.log(`✅ Carrera seleccionada: ${primeraCarrera.nombre} (${primeraCarrera.materias.length} materias)`);
      } else {
        setCarreraActiva(null);
        setMateriasActuales([]);
        console.log(`⚠️ No hay carreras válidas en ${nombreFacultad}`);
      }

    } catch (err) {
      console.error(`❌ Error cargando ${nombreFacultad}:`, err);
      setError(`Error cargando ${nombreFacultad}: ${err.message}`);
    }
  };

  const handleCambiarFacultad = async (nombreFacultad) => {
    console.log(`🔄 Cambiando a facultad: ${nombreFacultad}`);
    
    setFacultadActiva(nombreFacultad);
    setCarreraActiva(null);
    setMateriasActuales([]);
    
    // Verificar si ya tenemos los datos de esta facultad
    const facultadData = facultades.find(f => f.nombre === nombreFacultad);
    
    if (facultadData && facultadData.carreras && facultadData.carreras.length > 0) {
      // Ya tenemos los datos, usar cache
      console.log(`📋 Usando datos en cache para ${nombreFacultad}`);
      setCarreras(facultadData.carreras);
    } else {
      // Cargar datos frescos
      console.log(`🔄 Cargando datos frescos para ${nombreFacultad}`);
      await cargarDatosFacultad(nombreFacultad);
    }
  };

  const handleCambiarCarrera = (idCarrera) => {
    console.log(`🔄 Cambiando a carrera: ${idCarrera}`);
    setCarreraActiva(idCarrera);
    
    // Buscar la carrera en los datos actuales usando el id
    const carreraData = carreras.find(c => c.id === idCarrera);
    
    if (carreraData && carreraData.materias) {
      setMateriasActuales(carreraData.materias);
      console.log(`📚 Materias de ${carreraData.nombre}:`, carreraData.materias);
    } else {
      setMateriasActuales([]);
      console.log(`⚠️ No se encontraron materias para carrera ID: ${idCarrera}`);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (API_KEY) {
      cargarFacultadesYCarreras();
    }
  }, []);

  // Establecer fecha de actualización solo en el cliente (evita problemas de hidratación)
  useEffect(() => {
    setFechaActualizacion(new Date().toLocaleString('es-AR'));
  }, []);

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cronogramas de Exámenes UCASAL</h1>
          <Link href="/cronogramas/nuevo" className="bg-ucasal-blue text-white px-4 py-2 rounded hover:bg-blue-700">
            Nuevo Cronograma
          </Link>
        </div>

        {/* Información de configuración */}
     {/*    <div className="mb-6 p-4 bg-blue-100 border border-blue-400 rounded">
          <h2 className="font-bold">📋 Información:</h2>
          <p><strong>API Key:</strong> {API_KEY ? '✅ Configurada' : '❌ No configurada'}</p>
          <p><strong>Total Facultades:</strong> {facultades.length}</p>
          <p><strong>Total Carreras:</strong> {carreras.length}</p>
          <p><strong>Materias mostradas:</strong> {materiasActuales.length}</p>
        </div> */}

        {/* Notificación de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {cargando && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6 text-center">
            ⏳ Cargando datos...
            </div>
        )}

        {/* Selector de Facultades */}
        {facultades.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Seleccionar Facultad:</h2>
            <div className="flex flex-wrap gap-2">
              {facultades.map((facultad) => (
                <button
                  key={facultad.nombre}
                  onClick={() => handleCambiarFacultad(facultad.nombre)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    facultadActiva === facultad.nombre
                      ? 'bg-ucasal-blue text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  🏛️ {facultad.nombre}
                  <span className="ml-2 text-xs opacity-75">({facultad.carreras.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Título de la Facultad Activa */}
        {facultadActiva && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-ucasal-blue mb-2">
              🏛️ {facultadActiva}
            </h2>
            <p className="text-gray-600">
              {carreras.length} carrera{carreras.length !== 1 ? 's' : ''} disponible{carreras.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Navegación de Carreras (Pestañas) */}
        {carreras.length > 0 && (
          <TabNavigation 
            pestañas={carreras} 
            pestañaActiva={carreraActiva} 
            onCambiarPestaña={handleCambiarCarrera}
            conteos={carreras.reduce((acc, carrera) => {
              acc[carrera.id] = carrera.materias ? carrera.materias.length : 0;
              return acc;
            }, {})}
          />
        )}

        {/* Información de la carrera seleccionada */}
        {carreraActiva && (
          <div className="mb-6 px-4 py-3 bg-green-50 border-l-4 border-green-400 text-green-700 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">
                  Mostrando cronograma de: <strong>{carreraActiva}</strong> • {materiasActuales.length} materias
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Materias */}
        {materiasActuales.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                    <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📖 Materia</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📅 Fecha</th>
                    <th className="w-28 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">🕐 Hora</th>
                    <th className="w-80 h-auto px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📝 Tipo Examen</th>
                    <th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">👁️ Monitoreo</th>
                    <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📋 Material</th>
                    <th className="w-64 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">📄 Observaciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {materiasActuales.map((materia, index) => (
                    <tr key={materia.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="w-20 px-3 py-4 text-sm font-mono text-gray-500">
                        <div className="break-words">
                          {materia.codigo}
                        </div>
                      </td>
                      <td className="w-64 px-4 py-4 text-sm font-semibold text-gray-900">
                        <div className="break-words">
                          {materia.nombre}
                        </div>
                      </td>
                      <td className="w-28 px-3 py-4 text-sm text-gray-900">
                        <div className="break-words">
                          {materia.fecha}
                        </div>
                      </td>
                      <td className="w-20 px-3 py-4 text-sm text-gray-900">
                        <div className="break-words">
                          {materia.hora}
                        </div>
                      </td>
                      <td className="w-80 px-4 py-4 text-sm">
                        {materia.tipoExamen && (
                          <div className="break-words">
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                              materia.tipoExamen.includes('ORAL') ? 'bg-blue-100 text-blue-800' :
                              materia.tipoExamen.includes('ESCRITO') ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {materia.tipoExamen}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="w-32 px-3 py-4 text-sm">
                        {materia.monitoreo && (
                          <div className="break-words">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {materia.monitoreo}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="w-32 px-4 py-4 text-sm text-gray-900">
                        <div className="break-words" title={materia.materialPermitido}>
                          {materia.materialPermitido}
                        </div>
                      </td>
                      <td className="w-64 px-4 py-4 text-sm text-gray-900">
                        <div className="break-words" title={materia.observaciones}>
                          {materia.observaciones}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : carreraActiva && !cargando ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay materias disponibles</h3>
            <p className="text-gray-500">La carrera seleccionada no tiene materias registradas o los datos no son válidos.</p>
          </div>
        ) : !facultadActiva && !cargando && facultades.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-xl">📭 No se encontraron datos</p>
            <p>Verifica que la API Key esté configurada correctamente</p>
          </div>
        ) : null}

        {/* Información del origen */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-ucasal-blue" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Resumen de Datos
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Facultades</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">{facultades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Carreras</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">{carreras.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Materias mostradas</span>
                <span className="font-semibold">{materiasActuales.length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-ucasal-blue" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Información del Origen
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-3 py-2">
                <p className="font-semibold">Última actualización</p>
                <p className="text-sm text-gray-600">{fechaActualizacion || 'Cargando...'}</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3 py-2">
                <p className="font-semibold">Fuente de datos</p>
                <p className="text-sm text-gray-600">Google Sheets - UCASAL</p>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Los datos se obtienen directamente desde las hojas de cálculo de Google Sheets y se filtran automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Botón de recarga */}
        <div className="mt-8 text-center">
          <button 
            onClick={cargarFacultadesYCarreras}
            disabled={cargando}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {cargando ? 'Cargando...' : '🔄 Recargar Datos'}
          </button>
        </div>
      </div>
    </Layout>
  );
} 