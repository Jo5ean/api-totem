import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 text-gray-600 py-4 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <p className="text-sm">&copy; {currentYear} UCASAL - Tótem Institucional - Todos los derechos reservados</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm hover:text-ucasal-blue transition-colors">
              Ayuda
            </a>
            <a href="#" className="text-sm hover:text-ucasal-blue transition-colors">
              Contacto
            </a>
            <a href="#" className="text-sm hover:text-ucasal-blue transition-colors">
              Política de privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 