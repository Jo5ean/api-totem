import React from 'react';

/**
 * Componente para navegar entre las pestañas/facultades disponibles
 */
export default function TabNavigation({ pestañas, pestañaActiva, onCambiarPestaña, conteos = {} }) {
  // Si no hay pestañas, no mostramos nada
  if (!pestañas || pestañas.length === 0) {
    return null;
  }

  // Obtener nombre de carrera para mostrar (versión compacta)
  const obtenerNombreCarrera = (pestaña) => {
    const nombre = pestaña.nombre || pestaña.id || '';
    
    // Si es muy largo, mostrar solo los primeros caracteres significativos
    if (nombre.length > 20) {
      // Buscar patrones como "383 Tec. Op. Mineras" y mostrar versión corta
      const match = nombre.match(/^(\d+)\s*(.+)/);
    if (match) {
      const codigo = match[1];
        const nombreCorto = match[2];
        // Tomar las primeras palabras significativas
        const palabras = nombreCorto.split(' ').slice(0, 2).join(' ');
        return `${codigo} ${palabras}`;
    }
      return nombre.substring(0, 18) + '...';
    }
    
    return nombre;
  };

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex space-x-1 border-b border-gray-200 min-w-max">
      <button 
          onClick={() => onCambiarPestaña(null)}
          className={`font-extrabold px-4 py-2 text-sm font-medium whitespace-nowrap focus:outline-none
            ${!pestañaActiva
              ? 'text-ucasal-blue border-b-2 border-ucasal-blue'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Todas las carreras
        </button>
        {pestañas.map((pestaña) => (
          <button
            key={pestaña.id}
            onClick={() => onCambiarPestaña(pestaña.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap focus:outline-none flex items-center space-x-2
              ${pestaña.id === pestañaActiva
                ? 'text-ucasal-blue border-b-2 border-ucasal-blue'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            <span>{obtenerNombreCarrera(pestaña)}</span>
            {conteos[pestaña.id] !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${pestaña.id === pestañaActiva
                  ? 'bg-ucasal-blue text-white'
                  : 'bg-gray-200 text-gray-600'
                }`}>
                {conteos[pestaña.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 