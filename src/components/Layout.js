import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();
  
  // Función para verificar si un enlace está activo
  const isActive = (path) => router.pathname === path;
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-ucasal-blue text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/ucasalx.svg" 
              alt="Logo UCASAL" 
              width={120} 
              height={40}
              className="mr-3"
            />
            <h1 className="text-xl font-bold">Tótem - Backoffice</h1>
          </div>
          <div>
            {/* Aquí iría un componente de usuario/login en el futuro */}
            <span className="text-sm">Admin</span>
          </div>
        </div>
      </header>
      
      {/* Contenido principal con sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 shadow-md">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className={`block text-white p-2 rounded ${isActive('/dashboard') ? 'bg-ucasal-blue' : 'hover:bg-gray-200'}`}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/actas" className={`block p-2 rounded ${isActive('/actas') || router.pathname.startsWith('/actas/') ? 'bg-ucasal-blue text-white' : 'hover:bg-gray-200'}`}>
                  Actas
                </Link>
              </li>
              <li>
                <Link href="/cronogramas" className={`block p-2 rounded ${isActive('/cronogramas') || router.pathname.startsWith('/cronogramas/') ? 'bg-ucasal-blue text-white' : 'hover:bg-gray-200'}`}>
                  Cronogramas
                </Link>
              </li>
              <li>
                <Link href="/aulas" className={`block p-2 rounded ${isActive('/aulas') || router.pathname.startsWith('/aulas/') ? 'bg-ucasal-blue text-white' : 'hover:bg-gray-200'}`}>
                  Asignación de Aulas
                </Link>
              </li>
              <li>
                <Link href="/buscar" className={`block p-2 rounded ${isActive('/buscar') ? 'bg-ucasal-blue text-white' : 'hover:bg-gray-200'}`}>
                  Buscar Estudiante
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        
        {/* Contenido principal */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 