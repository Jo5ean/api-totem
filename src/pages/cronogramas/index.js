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
      console.log('📁 Cargando archivos JSON directamente...');
      
      // Lista de facultades basada en los directorios realmente disponibles
      const facultadesConocidas = [
        { nombre: 'Facultad de Economía y Administración', archivo: 'economia-administracion' },
        { nombre: 'Facultad de Arquitectura y Urbanismo', archivo: 'arquitectura-urbanismo' },
        { nombre: 'Facultad de Ciencias Jurídicas', archivo: 'ciencias-juridicas' },
        { nombre: 'Facultad de Educación', archivo: 'educacion' },
        { nombre: 'Escuela Universitaria de Educación Física', archivo: 'educacion-fisica' },
        { nombre: 'Facultad de Ingeniería', archivo: 'ingenieria' },
        { nombre: 'Facultad de Turismo', archivo: 'turismo' }
      ];

      // Verificar qué facultades tienen archivos JSON disponibles
      const facultadesDisponibles = [];
      
      for (const facultad of facultadesConocidas) {
        try {
          const response = await fetch(`/descargas_csv/${facultad.archivo}/cache_examenes.json`);
          if (response.ok) {
            const jsonData = await response.json();
            const totalCarreras = Object.keys(jsonData.datos.carreras || {}).length;
            const totalExamenes = jsonData.datos.resumen?.totalExamenes || 0;
            
            let estado = 'normal';
            let mensaje = '';
            
            if (totalCarreras === 0) {
              estado = 'sin-examenes';
              mensaje = 'No hay exámenes programados que cumplan con las condiciones de fecha';
            } else if (totalExamenes === 0) {
              estado = 'sin-examenes'; 
              mensaje = 'No hay exámenes programados actualmente';
            }
            
            facultadesDisponibles.push({
              nombre: facultad.nombre,
              carreras: [], // Las cargaremos después
              status: totalExamenes > 0 ? `✅ ${totalCarreras} carreras, ${totalExamenes} exámenes` : `📅 Sin exámenes próximos`,
              totalHojas: totalCarreras,
              archivo: facultad.archivo,
              estadoFacultad: estado,
              mensajeEstado: mensaje,
              totalExamenesOriginales: totalExamenes
            });
            
            console.log(`✅ ${facultad.nombre}: ${totalCarreras} carreras, ${totalExamenes} exámenes`);
          } else {
            console.log(`⚠️ ${facultad.nombre}: archivo no encontrado`);
            
            facultadesDisponibles.push({
              nombre: facultad.nombre,
              carreras: [],
              status: '📝 Sin datos disponibles',
              totalHojas: 0,
              archivo: facultad.archivo,
              estadoFacultad: 'sin-datos',
              mensajeEstado: 'No hay cronogramas generados para esta facultad'
            });
          }
        } catch (error) {
          console.log(`❌ Error verificando ${facultad.nombre}:`, error.message);
          
          facultadesDisponibles.push({
            nombre: facultad.nombre,
            carreras: [],
            status: '📝 Sin datos disponibles',
            totalHojas: 0,
            archivo: facultad.archivo,
            estadoFacultad: 'sin-datos',
            mensajeEstado: 'No hay cronogramas disponibles actualmente'
          });
        }
      }

      console.log(`✅ Se procesaron ${facultadesDisponibles.length} facultades`);
      
      setFacultades(facultadesDisponibles);
      
      // Seleccionar primera facultad que tenga datos por defecto
      const facultadConDatos = facultadesDisponibles.find(f => f.estadoFacultad === 'normal') || facultadesDisponibles[0];
      
      if (facultadConDatos) {
        setFacultadActiva(facultadConDatos.nombre);
        await cargarDatosFacultad(facultadConDatos.nombre);
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
      // Buscar el archivo de la facultad
      const facultadData = facultades.find(f => f.nombre === nombreFacultad);
      const archivo = facultadData?.archivo;
      
      if (!archivo) {
        console.log(`ℹ️ ${nombreFacultad}: No tiene configuración de archivo definida`);
        
        // Tratar como facultad sin datos disponibles (no como error)
        setFacultades(prev => prev.map(fac => 
          fac.nombre === nombreFacultad 
            ? { 
                ...fac, 
                carreras: [], 
                totalHojas: 0,
                estadoFacultad: 'sin-configuracion',
                mensajeEstado: 'Facultad sin configuración de cronogramas'
              }
            : fac
        ));
        
        setCarreras([]);
        setCarreraActiva(null);
        setMateriasActuales([]);
        
        // Limpiar errores previos
        if (error && error.includes(nombreFacultad)) {
          setError(null);
        }
        
        return; // Salir de la función sin hacer más procesamiento
      }

      console.log(`🔍 Cargando archivo: /descargas_csv/${archivo}/cache_examenes.json`);
      
      // Cargar directamente el archivo JSON
      const response = await fetch(`/descargas_csv/${archivo}/cache_examenes.json`);

      if (!response.ok) {
        throw new Error(`Archivo no encontrado o inaccesible`);
      }
      
      const jsonData = await response.json();
      console.log(`📋 Datos cargados de ${nombreFacultad}:`, jsonData);

      // Procesar los datos del JSON
      let carrerasValidas = [];
      let tieneExamenes = false;
      let totalExamenesEncontrados = jsonData.datos.resumen?.totalExamenes || 0;
      
      const carrerasData = jsonData.datos.carreras || {};
      
      if (Object.keys(carrerasData).length === 0) {
        console.log(`⚠️ ${nombreFacultad}: No hay carreras en los datos`);
      } else {
        carrerasValidas = Object.values(carrerasData).map(carrera => ({
          nombre: carrera.nombre,
          codigo: carrera.codigo,
          id: carrera.codigo,
          title: carrera.nombre,
          materias: (carrera.examenes || []).map(examen => ({
            id: `${carrera.codigo}-${examen.materia}-${examen.fecha?.iso || examen.fecha?.original}`,
            nombre: examen.materia,
            codigo: carrera.codigo,
            fecha: examen.fecha?.original || examen.fecha,
            hora: examen.hora,
            tipoExamen: examen.tipoExamen,
            materialPermitido: examen.materialPermitido,
            observaciones: examen.observaciones,
            monitoreo: examen.monitoreo !== '---------------' && 
                      examen.monitoreo !== '-----------------' && 
                      examen.monitoreo !== '-------' && 
                      examen.monitoreo !== '-----------' && 
                      examen.monitoreo !== '---------------------' && 
                      examen.monitoreo !== '----------------' ? examen.monitoreo : ''
          }))
        }));
        
        tieneExamenes = carrerasValidas.some(c => c.materias && c.materias.length > 0);
      }

      // Filtrar carreras válidas
      const carrerasConMaterias = carrerasValidas
        .filter(carrera => {
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
          id: carrera.codigo || carrera.id || carrera.nombre,
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

      console.log(`📊 ${nombreFacultad}: ${carrerasConMaterias.length} carreras válidas de ${carrerasValidas.length} totales`);

      // Determinar el estado de la facultad
      let estadoFacultad = 'normal';
      let mensajeEstado = '';
      
      if (carrerasConMaterias.length === 0) {
        if (!tieneExamenes || totalExamenesEncontrados === 0) {
          estadoFacultad = 'sin-examenes';
          mensajeEstado = 'No hay exámenes programados que cumplan con las condiciones de fecha (desde hoy en adelante)';
        } else {
          estadoFacultad = 'examenes-invalidos';
          mensajeEstado = 'Los exámenes encontrados no tienen datos válidos (fechas o materias incompletas)';
        }
      }

      // Actualizar carreras para esta facultad
      setCarreras(carrerasConMaterias);
      
      // Actualizar facultades con las carreras cargadas y estado
      setFacultades(prev => prev.map(fac => 
        fac.nombre === nombreFacultad 
          ? { 
              ...fac, 
              carreras: carrerasConMaterias, 
              totalHojas: carrerasConMaterias.length,
              estadoFacultad,
              mensajeEstado,
              totalExamenesOriginales: totalExamenesEncontrados
            }
          : fac
      ));

      // Seleccionar primera carrera por defecto si hay carreras válidas
      if (carrerasConMaterias.length > 0) {
        const primeraCarrera = carrerasConMaterias[0];
        setCarreraActiva(primeraCarrera.id);
        setMateriasActuales(primeraCarrera.materias || []);
        console.log(`✅ Carrera seleccionada: ${primeraCarrera.nombre} (${primeraCarrera.materias.length} materias)`);
        
        // Limpiar mensaje de error si había uno
        if (error && error.includes(nombreFacultad)) {
          setError(null);
        }
      } else {
        setCarreraActiva(null);
        setMateriasActuales([]);
        console.log(`⚠️ ${nombreFacultad}: ${mensajeEstado}`);
        
        // No establecer como error si simplemente no hay exámenes válidos por fecha
        if (estadoFacultad === 'examenes-invalidos') {
          setError(`${nombreFacultad}: ${mensajeEstado}`);
        } else {
          setError(null); // Limpiar error, es normal no tener exámenes
        }
      }

    } catch (err) {
      console.error(`❌ Error cargando ${nombreFacultad}:`, err);
      
      // Determinar si es realmente un error o solo falta de datos
      let estadoFacultad = 'sin-datos';
      let mensajeEstado = 'No hay cronogramas disponibles para esta facultad';
      
      // Solo tratar como error real si es un problema técnico grave
      if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('server')) {
        estadoFacultad = 'error';
        mensajeEstado = `Error técnico: ${err.message}`;
      }
      
      // Actualizar facultad con estado apropiado
      setFacultades(prev => prev.map(fac => 
        fac.nombre === nombreFacultad 
          ? { 
              ...fac, 
              carreras: [], 
              totalHojas: 0,
              estadoFacultad,
              mensajeEstado
            }
          : fac
      ));
      
      // Solo mostrar error en la UI si es un problema técnico real
      if (estadoFacultad === 'error') {
      setError(`Error cargando ${nombreFacultad}: ${err.message}`);
      } else {
        // Limpiar errores previos si era solo falta de datos
        if (error && error.includes(nombreFacultad)) {
          setError(null);
        }
      }
      
      setCarreras([]);
      setCarreraActiva(null);
      setMateriasActuales([]);
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

  // Función para verificar si un examen ya pasó
  const esExamenPasado = (fecha, hora) => {
    if (!fecha) return false;
    
    try {
      // Parsear fecha en formato DD/MM/YYYY
      const [dia, mes, año] = fecha.split('/').map(num => parseInt(num));
      const fechaExamen = new Date(año, mes - 1, dia);
      
      // Si hay hora, agregarla
      if (hora && hora.trim()) {
        const [horas, minutos] = hora.split(':').map(num => parseInt(num));
        fechaExamen.setHours(horas, minutos || 0);
      } else {
        // Si no hay hora, considerar final del día
        fechaExamen.setHours(23, 59, 59);
      }
      
      const ahora = new Date();
      return fechaExamen < ahora;
    } catch (error) {
      return false;
    }
  };

  // Función para obtener clases CSS según el estado del examen
  const obtenerClasesExamen = (fecha, hora, index) => {
    const esPasado = esExamenPasado(fecha, hora);
    const esParOImpar = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
    
    if (esPasado) {
      return index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-200';
    }
    
    return esParOImpar;
  };

  // Función para obtener clases de texto según el estado del examen
  const obtenerClasesTexto = (fecha, hora) => {
    const esPasado = esExamenPasado(fecha, hora);
    return esPasado ? 'text-gray-500' : 'text-gray-900';
  };

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
              {facultades.map((facultad) => {
                const tieneCarreras = facultad.carreras && facultad.carreras.length > 0;
                const estado = facultad.estadoFacultad;
                
                // Determinar el color y icono según el estado
                let colorClases = '';
                let icono = '🏛️';
                
                if (estado === 'sin-examenes') {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300';
                  icono = '📅';
                } else if (estado === 'sin-datos') {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300';
                  icono = '📝';
                } else if (estado === 'sin-configuracion') {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-300';
                  icono = '⚙️';
                } else if (estado === 'error') {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-red-500 text-white'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300';
                  icono = '❌';
                } else if (estado === 'examenes-invalidos') {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-300';
                  icono = '⚠️';
                } else if (tieneCarreras) {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-ucasal-blue text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300';
                  icono = '✅';
                } else {
                  colorClases = facultadActiva === facultad.nombre
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-300';
                  icono = '🔄';
                }
                
                return (
                <button
                  key={facultad.nombre}
                  onClick={() => handleCambiarFacultad(facultad.nombre)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${colorClases}`}
                    title={facultad.mensajeEstado || `${facultad.carreras?.length || 0} carreras disponibles`}
                  >
                    {icono} {facultad.nombre}
                    <span className="ml-2 text-xs opacity-75">
                      ({tieneCarreras ? facultad.carreras.length : '0'})
                    </span>
                </button>
                );
              })}
            </div>
            
            {/* Leyenda de iconos */}
            <div className="mt-3 text-xs text-gray-500">
              <span className="font-medium">Leyenda:</span>
              <span className="ml-2">✅ Con exámenes</span>
              <span className="ml-2">📅 Sin exámenes próximos</span>
              <span className="ml-2">📝 Sin datos disponibles</span>
              <span className="ml-2">⚙️ Sin configuración</span>
              <span className="ml-2">❌ Error</span>
              <span className="ml-2">🔄 Cargando</span>
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
                <p className="text-xs mt-1 opacity-75">
                  Se muestran exámenes desde una semana atrás hasta el futuro
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leyenda de estados de exámenes */}
        {materiasActuales.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
              <span>Próximos exámenes</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-200 border border-gray-300 rounded mr-2"></div>
              <span className="text-gray-500">Exámenes pasados</span>
            </div>
          </div>
        )}

        {/* Información del estado de la facultad activa */}
        {facultadActiva && facultades.find(f => f.nombre === facultadActiva)?.estadoFacultad && (
          (() => {
            const facultadData = facultades.find(f => f.nombre === facultadActiva);
            const estado = facultadData?.estadoFacultad;
            
            if (estado === 'sin-examenes') {
              return (
                <div className="mb-6 px-4 py-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Sin exámenes próximos</h3>
                      <p className="text-sm mt-1">
                        {facultadData.mensajeEstado}
                        {facultadData.totalExamenesOriginales > 0 && (
                          <span className="block mt-1 text-xs">
                            ({facultadData.totalExamenesOriginales} exámenes encontrados en total, pero ninguno cumple las condiciones de fecha)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (estado === 'sin-datos') {
              return (
                <div className="mb-6 px-4 py-3 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1-4a1 1 0 00-1-1h-4a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V6zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Sin cronogramas disponibles</h3>
                      <p className="text-sm mt-1">
                        {facultadData.mensajeEstado}
                        <span className="block mt-1 text-xs">
                          Esta facultad puede no tener exámenes programados actualmente o los datos aún no han sido procesados.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (estado === 'sin-configuracion') {
              return (
                <div className="mb-6 px-4 py-3 bg-gray-50 border-l-4 border-gray-400 text-gray-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Facultad sin configuración</h3>
                      <p className="text-sm mt-1">
                        {facultadData.mensajeEstado}
                        <span className="block mt-1 text-xs">
                          Esta facultad no está configurada en el sistema de cronogramas. Contacte al administrador para habilitarla.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            } else if (estado === 'examenes-invalidos') {
              return (
                <div className="mb-6 px-4 py-3 bg-orange-50 border-l-4 border-orange-400 text-orange-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Datos incompletos</h3>
                      <p className="text-sm mt-1">{facultadData.mensajeEstado}</p>
                    </div>
                  </div>
                </div>
              );
            } else if (estado === 'error') {
              return (
                <div className="mb-6 px-4 py-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">Error al cargar datos</h3>
                      <p className="text-sm mt-1">{facultadData.mensajeEstado}</p>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()
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
                    <tr key={materia.id} className={obtenerClasesExamen(materia.fecha, materia.hora, index)}>
                      <td className={`w-20 px-3 py-4 text-sm font-mono ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        <div className="break-words">
                          {materia.codigo}
                        </div>
                      </td>
                      <td className={`w-64 px-4 py-4 text-sm font-semibold ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        <div className="break-words">
                          {materia.nombre}
                        </div>
                      </td>
                      <td className={`w-28 px-3 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        <div className="break-words flex items-center">
                          {esExamenPasado(materia.fecha, materia.hora) && (
                            <svg className="h-3 w-3 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                          {materia.fecha}
                        </div>
                      </td>
                      <td className={`w-20 px-3 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        <div className="break-words">
                          {materia.hora}
                        </div>
                      </td>
                      <td className={`w-80 px-4 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
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
                      <td className={`w-32 px-3 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        {materia.monitoreo && (
                          <div className="break-words">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                              {materia.monitoreo}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className={`w-32 px-4 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
                        <div className="break-words" title={materia.materialPermitido}>
                          {materia.materialPermitido}
                        </div>
                      </td>
                      <td className={`w-64 px-4 py-4 text-sm ${obtenerClasesTexto(materia.fecha, materia.hora)}`}>
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
              {materiasActuales.length > 0 && (() => {
                const examenesPasados = materiasActuales.filter(m => esExamenPasado(m.fecha, m.hora)).length;
                const examenesFuturos = materiasActuales.length - examenesPasados;
                
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm ml-4">• Pasados</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">{examenesPasados}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 text-sm ml-4">• Próximos</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">{examenesFuturos}</span>
                    </div>
                  </>
                );
              })()}
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