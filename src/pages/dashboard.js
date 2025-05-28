import Layout from '../components/Layout';

export default function Dashboard() {
  // Datos simulados para el dashboard
  const resumenDatos = {
    totalActas: 24,
    actasHoy: 5,
    totalEstudiantes: 342,
    aulasAsignadas: 18,
    pendienteAsignacion: 6
  };

  return (
    <Layout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="text-sm text-gray-600">
            <span>Ciclo académico:</span>
            <span className="ml-2 font-semibold">2025 - 1° Semestre</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjetas de resumen */}
          <div className="bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-md bg-blue-100 text-ucasal-blue mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Actas</h2>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Total</div>
              <div className="text-xl font-bold">{resumenDatos.totalActas}</div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-gray-600">Hoy</div>
              <div className="text-xl font-bold">{resumenDatos.actasHoy}</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-md bg-green-100 text-green-700 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Estudiantes</h2>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Inscriptos</div>
              <div className="text-xl font-bold">{resumenDatos.totalEstudiantes}</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow transition-all hover:shadow-md">
            <div className="flex items-center mb-2">
              <div className="p-2 rounded-md bg-yellow-100 text-yellow-700 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold">Aulas</h2>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Asignadas</div>
              <div className="text-xl font-bold">{resumenDatos.aulasAsignadas}</div>
            </div>
            <div className="flex justify-between mt-2">
              <div className="text-gray-600">Pendientes</div>
              <div className="text-xl font-bold text-yellow-600">{resumenDatos.pendienteAsignacion}</div>
            </div>
          </div>
        </div>
        
        {/* Próximos exámenes */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Próximos Exámenes</h2>
            <span className="text-sm text-gray-500">Se muestran los próximos 3 días</span>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscriptos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">15/06/2025 - 09:00</td>
                  <td className="px-6 py-4 whitespace-nowrap">Programación I</td>
                  <td className="px-6 py-4 whitespace-nowrap">32</td>
                  <td className="px-6 py-4 whitespace-nowrap">Aula 204</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">18/06/2025 - 14:00</td>
                  <td className="px-6 py-4 whitespace-nowrap">Bases de Datos</td>
                  <td className="px-6 py-4 whitespace-nowrap">28</td>
                  <td className="px-6 py-4 whitespace-nowrap">Aula 301</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">20/06/2025 - 10:00</td>
                  <td className="px-6 py-4 whitespace-nowrap">Derecho Civil</td>
                  <td className="px-6 py-4 whitespace-nowrap">45</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pendiente
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 