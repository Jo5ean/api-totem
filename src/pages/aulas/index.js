import { useState } from 'react';
import Layout from '../../components/Layout';

export default function Aulas() {
  // Datos simulados para asignación de aulas
  const [examenes, setExamenes] = useState([
    {
      id: 1,
      materia: 'Programación I',
      comision: 'A',
      fecha: '2025-06-15T09:00:00',
      carrera: 'Ingeniería en Informática',
      facultad: 'Ingeniería',
      estudiantes: 32,
      aula: 'Aula 204',
      edificio: 'Central',
      asignada: true
    },
    {
      id: 2,
      materia: 'Bases de Datos',
      comision: 'B',
      fecha: '2025-06-18T14:00:00',
      carrera: 'Ingeniería en Informática',
      facultad: 'Ingeniería',
      estudiantes: 28,
      aula: 'Aula 301',
      edificio: 'Central',
      asignada: true
    },
    {
      id: 3,
      materia: 'Derecho Civil',
      comision: 'A',
      fecha: '2025-06-20T10:00:00',
      carrera: 'Abogacía',
      facultad: 'Jurídicas',
      estudiantes: 45,
      aula: '',
      edificio: '',
      asignada: false
    }
  ]);

  // Función para asignar aula
  const asignarAula = (id, aula, edificio) => {
    setExamenes(
      examenes.map(examen => 
        examen.id === id 
          ? { ...examen, aula: aula, edificio: edificio, asignada: true } 
          : examen
      )
    );
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR') + ' - ' + date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  // Lista de aulas disponibles (simuladas)
  const aulasDisponibles = [
    { id: 1, nombre: 'Aula 101', edificio: 'Central', capacidad: 30 },
    { id: 2, nombre: 'Aula 102', edificio: 'Central', capacidad: 30 },
    { id: 3, nombre: 'Aula 103', edificio: 'Central', capacidad: 25 },
    { id: 4, nombre: 'Aula 201', edificio: 'Central', capacidad: 40 },
    { id: 5, nombre: 'Aula 202', edificio: 'Central', capacidad: 40 },
    { id: 6, nombre: 'Aula 203', edificio: 'Central', capacidad: 35 },
    { id: 7, nombre: 'Aula 204', edificio: 'Central', capacidad: 35 },
    { id: 8, nombre: 'Aula 301', edificio: 'Central', capacidad: 50 },
    { id: 9, nombre: 'Aula 302', edificio: 'Central', capacidad: 50 },
    { id: 10, nombre: 'Aula 401', edificio: 'Anexo', capacidad: 60 },
    { id: 11, nombre: 'Aula 402', edificio: 'Anexo', capacidad: 60 },
    { id: 12, nombre: 'Aula 403', edificio: 'Anexo', capacidad: 80 }
  ];

  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('');
  const [edificioSeleccionado, setEdificioSeleccionado] = useState('');

  // Función para abrir modal
  const abrirModal = (examen) => {
    setExamenSeleccionado(examen);
    setShowModal(true);
  };

  // Función para guardar asignación
  const guardarAsignacion = () => {
    if (examenSeleccionado && aulaSeleccionada) {
      asignarAula(examenSeleccionado.id, aulaSeleccionada, edificioSeleccionado);
      setShowModal(false);
      setExamenSeleccionado(null);
      setAulaSeleccionada('');
      setEdificioSeleccionado('');
    }
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Asignación de Aulas</h1>
        
        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facultad</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2">
                <option value="">Todas</option>
                <option value="Ingeniería">Ingeniería</option>
                <option value="Jurídicas">Jurídicas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2">
                <option value="">Todos</option>
                <option value="asignada">Asignadas</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded w-full">
                Filtrar
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabla de exámenes y aulas asignadas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facultad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {examenes.map((examen) => (
                <tr key={examen.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.materia} ({examen.comision})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(examen.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.facultad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.estudiantes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {examen.asignada ? (
                      <span className="text-green-600">
                        {examen.aula} - {examen.edificio}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => abrirModal(examen)}
                      className="text-ucasal-blue hover:text-blue-900">
                      {examen.asignada ? 'Cambiar' : 'Asignar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Modal para asignar aula */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="relative mx-auto p-5 border shadow-lg rounded-md bg-white w-full max-w-md">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Asignar Aula para {examenSeleccionado?.materia}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Edificio
                    </label>
                    <select 
                      value={edificioSeleccionado}
                      onChange={(e) => setEdificioSeleccionado(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2">
                      <option value="">Seleccione edificio</option>
                      <option value="Central">Central</option>
                      <option value="Anexo">Anexo</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                      Aula
                    </label>
                    <select 
                      value={aulaSeleccionada}
                      onChange={(e) => setAulaSeleccionada(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2">
                      <option value="">Seleccione aula</option>
                      {aulasDisponibles
                        .filter(aula => !edificioSeleccionado || aula.edificio === edificioSeleccionado)
                        .filter(aula => aula.capacidad >= (examenSeleccionado?.estudiantes || 0))
                        .map(aula => (
                          <option key={aula.id} value={aula.nombre}>
                            {aula.nombre} - Cap: {aula.capacidad}
                          </option>
                        ))}
                    </select>
                  </div>
                  
                  <div className="text-sm text-left mb-4">
                    <p><strong>Estudiantes inscriptos:</strong> {examenSeleccionado?.estudiantes}</p>
                    <p><strong>Fecha:</strong> {examenSeleccionado ? formatDate(examenSeleccionado.fecha) : ''}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300">
                      Cancelar
                    </button>
                    <button
                      onClick={guardarAsignacion}
                      disabled={!aulaSeleccionada || !edificioSeleccionado}
                      className={`px-4 py-2 text-white text-base font-medium rounded-md shadow-sm ${aulaSeleccionada && edificioSeleccionado ? 'bg-ucasal-blue hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 