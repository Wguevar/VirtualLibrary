import { Outlet, NavLink } from 'react-router-dom';
import { FaChartBar, FaBook, FaFileAlt, FaAngleDoubleLeft, FaAngleDoubleRight, FaBars } from 'react-icons/fa';
import React, { useEffect, useState } from 'react';



export default function AdminLayout() {
  // Estado global para notificaciones en modo demo
  const [morososCount, setMorososCount] = useState(1);
  const [pendientesCount, setPendientesCount] = useState(2);

  // Funciones para actualizar los contadores desde hijos (por ejemplo, desde AdminReportsPage)
  const handleMorosoDesbloqueado = () => setMorososCount(c => Math.max(0, c - 1));
  const handlePedidoRespondido = () => setPendientesCount(c => Math.max(0, c - 1));

  const adminLinks = [
    { to: '/admin', label: 'Estadísticas', icon: <FaChartBar />, end: true },
    { to: '/admin/libros', label: 'Libros', icon: <FaBook /> },
    { to: '/admin/reportes', label: 'Reportes', icon: <FaFileAlt />, notis: { morosos: morososCount, pendientes: pendientesCount } },
  ];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Botón menú móvil */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 bg-white p-2 rounded shadow-lg border border-gray-200"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Abrir menú"
      >
        <FaBars size={22} />
      </button>
      {/* Menú lateral */}
      <aside
        className={`transition-all duration-300 bg-white shadow-lg p-4 flex flex-col gap-4 z-40
          ${collapsed ? 'w-20' : 'w-64'}
          md:static md:translate-x-0 md:h-auto
          fixed top-0 left-0 h-full
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:block
        `}
        style={{ maxWidth: collapsed ? '5rem' : '16rem' }}
      >
        <div className="flex items-center justify-between mb-8">
          {!collapsed && <h2 className="text-2xl font-bold text-center flex-1">Admin</h2>}
          <button
            className="p-2 rounded hover:bg-gray-200 transition ml-auto"
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expandir menú' : 'Minimizar menú'}
          >
            {collapsed ? <FaAngleDoubleRight size={20} /> : <FaAngleDoubleLeft size={20} />}
          </button>
          {/* Botón cerrar menú móvil */}
          <button
            className="md:hidden ml-2 p-2 rounded hover:bg-gray-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            ✖️
          </button>
        </div>
        <nav className="flex flex-col gap-2">
          {adminLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-lg font-medium transition-all whitespace-nowrap overflow-hidden ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'
                } ${collapsed ? 'justify-center' : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-xl">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
              {/* Notificaciones para la pestaña de reportes */}
              {link.to === '/admin/reportes' && link.notis && !collapsed && (
                <span className="flex gap-1 ml-2">
                  {link.notis.morosos > 0 && (
                    <span title="Usuarios morosos" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 border-2 border-white text-white text-xs font-bold">
                      {link.notis.morosos}
                    </span>
                  )}
                  {link.notis.pendientes > 0 && (
                    <span title="Pedidos por responder" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 border-2 border-white text-gray-800 text-xs font-bold">
                      {link.notis.pendientes}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      {/* Fondo oscuro para menú móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Contenido */}
      <main className="flex-1 p-2 sm:p-4 md:p-8 transition-all duration-300">
        {/* Pasar funciones de actualización como contexto */}
        <Outlet context={{ handleMorosoDesbloqueado, handlePedidoRespondido }} />
      </main>
    </div>
  );
} 