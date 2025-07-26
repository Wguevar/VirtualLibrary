import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useOutletContext } from 'react-router-dom';



// Hook para obtener y desbloquear usuarios morosos
function useMorosos() {
  const [morosos, setMorosos] = useState<any[]>([]);
  const [loadingMorosos, setLoadingMorosos] = useState(true);
  const [errorMorosos, setErrorMorosos] = useState<string | null>(null);

  const fetchMorosos = async () => {
    setLoadingMorosos(true);
    setErrorMorosos(null);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, correo, estado')
      .eq('estado', 'Moroso');
    if (error) {
      setErrorMorosos('Error al obtener usuarios morosos');
      setMorosos([]);
    } else {
      setMorosos(data || []);
    }
    setLoadingMorosos(false);
  };

  const desbloquearUsuario = async (id: number) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ estado: 'Activo' })
      .eq('id', id);
    if (!error) {
      setMorosos(prev => prev.filter(u => u.id !== id));
    }
  };

  useEffect(() => {
    fetchMorosos();
  }, []);

  return { morosos, loadingMorosos, errorMorosos, desbloquearUsuario, fetchMorosos };
}

// Utilidades visuales para badges e iconos
const estadoBadge = {
  'Pendiente de buscar': 'bg-yellow-400 text-white',
  'Prestado': 'bg-blue-500 text-white',
  'Moroso': 'bg-red-500 text-white',
  'Completado': 'bg-green-500 text-white',
  'Cancelado': 'bg-gray-400 text-white',
} as const;
const estadoIcon = {
  'Pendiente de buscar': '🟡',
  'Prestado': '📘',
  'Moroso': '🔴',
  'Completado': '🟢',
  'Cancelado': '⚪',
} as const;

type EstadoReserva = keyof typeof estadoBadge;

const AdminReportsPage = () => {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroAccion, setFiltroAccion] = useState<string>('');
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState<string>('usuario'); // usuario, libro, fecha

  useEffect(() => {
    const checkVencimientos = async () => {
      try {
        // Ejecutar verificación de vencimientos usando SQL directo
        const { error } = await supabase
          .from('ordenes')
          .update({ estado: 'Cancelado' })
          .eq('estado', 'Pendiente de buscar')
          .lt('fecha_limite_busqueda', new Date().toISOString());
          
        if (error) {
          console.error('Error al verificar vencimientos de búsqueda:', error);
        } else {
          console.log('Vencimientos de búsqueda verificados');
        }
        
        // Verificar vencimientos de devolución y marcar como moroso
        const { error: errorDevolucion } = await supabase
          .from('ordenes')
          .update({ estado: 'Moroso' })
          .eq('estado', 'Prestado')
          .lt('fecha_limite_devolucion', new Date().toISOString());
          
        if (errorDevolucion) {
          console.error('Error al verificar vencimientos de devolución:', errorDevolucion);
        } else {
          console.log('Vencimientos de devolución verificados');
        }

        // Actualizar estado de usuarios que tienen órdenes morosas
        const { data: ordenesMorosas, error: errorUsuarios } = await supabase
          .from('ordenes')
          .select('usuario_id')
          .eq('estado', 'Moroso');

        console.log('🔍 Verificando órdenes morosas:', ordenesMorosas);
        console.log('❌ Error al obtener órdenes morosas:', errorUsuarios);

        if (!errorUsuarios && ordenesMorosas) {
          // Obtener IDs únicos de usuarios con órdenes morosas (filtrar nulls)
          const usuariosMorosos = [...new Set(ordenesMorosas.map(o => o.usuario_id).filter(id => id !== null))];
          
          console.log('👥 Usuarios que deberían estar morosos:', usuariosMorosos);
          
          if (usuariosMorosos.length > 0) {
            // Marcar usuarios como morosos
            const { error: errorUpdateUsuarios } = await supabase
              .from('usuarios')
              .update({ estado: 'Moroso' })
              .in('id', usuariosMorosos);
              
            if (errorUpdateUsuarios) {
              console.error('❌ Error al actualizar estado de usuarios morosos:', errorUpdateUsuarios);
            } else {
              console.log('✅ Usuarios marcados como morosos:', usuariosMorosos);
            }
          } else {
            console.log('ℹ️ No hay usuarios para marcar como morosos');
          }
        } else {
          console.log('ℹ️ No se encontraron órdenes morosas o hubo error');
        }

        // También verificar usuarios que ya no tienen órdenes morosas y desbloquearlos
        const { data: usuariosMorososActuales, error: errorUsuariosMorosos } = await supabase
          .from('usuarios')
          .select('id')
          .eq('estado', 'Moroso');

        if (!errorUsuariosMorosos && usuariosMorososActuales) {
          for (const usuario of usuariosMorososActuales) {
            // Verificar si el usuario tiene órdenes morosas
            const { data: ordenesDelUsuario, error: errorOrdenes } = await supabase
              .from('ordenes')
              .select('id')
              .eq('usuario_id', usuario.id)
              .eq('estado', 'Moroso');

            if (!errorOrdenes && (!ordenesDelUsuario || ordenesDelUsuario.length === 0)) {
              // El usuario no tiene órdenes morosas, desbloquearlo
              const { error: errorDesbloquear } = await supabase
                .from('usuarios')
                .update({ estado: 'Activo' })
                .eq('id', usuario.id);

              if (errorDesbloquear) {
                console.error('Error al desbloquear usuario:', errorDesbloquear);
              } else {
                console.log('Usuario desbloqueado:', usuario.id);
              }
            }
          }
        }
        
      } catch (error) {
        console.error('Error al ejecutar verificación de vencimientos:', error);
      }
    };

    const fetchOrdenes = async () => {
      setLoading(true);
      setError(null);
      // Traer órdenes de libros físicos y unir con Libros y Usuarios
      const { data, error } = await supabase
        .from('ordenes')
        .select('id, libro_id, usuario_id, estado, fecha_reserva, fecha_entrega, fecha_devolucion, fecha_limite_busqueda, fecha_limite_devolucion, Libros(titulo), usuarios(correo, nombre)')
        .order('fecha_reserva', { ascending: false });
      if (error) {
        console.error('Error Supabase:', error);
        setError('Error al obtener órdenes');
        setOrdenes([]);
      } else {
        setOrdenes(data || []);
      }
      setLoading(false);
    };

    // Primero verificar vencimientos, luego cargar órdenes
    checkVencimientos().then(() => {
      fetchOrdenes();
    });
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroEstado, filtroAccion, searchTerm, searchBy]);

  // Función para actualizar el estado de la orden
  const updateOrdenEstado = async (id: number, nuevoEstado: string) => {
    const orden = ordenes.find(o => o.id === id);
    let updateData: any = { estado: nuevoEstado };

    // Si se cambia a 'Prestado', establecer fecha_entrega
    if (nuevoEstado === 'Prestado' && !orden?.fecha_entrega) {
      updateData.fecha_entrega = new Date().toISOString();
    }

    // Si se cambia a 'Completado', establecer fecha_devolucion
    if (nuevoEstado === 'Completado' && !orden?.fecha_devolucion) {
      updateData.fecha_devolucion = new Date().toISOString();
    }

    const { error } = await supabase
      .from('ordenes')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      setOrdenes(prev => prev.map(o => o.id === id ? { ...o, ...updateData } : o));
      
      // Si se responde un pedido pendiente, disminuir contador
      if (orden && orden.estado === 'Pendiente de buscar' && nuevoEstado !== 'Pendiente de buscar' && handlePedidoRespondido) {
        handlePedidoRespondido();
      }
      
      setMsg(`Estado actualizado a ${nuevoEstado}${updateData.fecha_devolucion ? ' - Fecha de devolución registrada' : ''}`);
      setTimeout(() => setMsg(null), 3000);
    } else {
      setMsg('Error al actualizar estado');
      setTimeout(() => setMsg(null), 2000);
    }
  };



  // Estados posibles de una reserva
  const ESTADOS = [
    'Pendiente de buscar',
    'Prestado',
    'Completado',
    'Cancelado',
    'Moroso',
  ];

  // Función para saber si una orden requiere atención
  function requiereAtencion(orden: any) {
    if (orden.estado === 'Pendiente de buscar' && orden.fecha_reserva) {
      const fechaReserva = dayjs(orden.fecha_reserva);
      return dayjs().diff(fechaReserva, 'hour') >= 24;
    }
    if (orden.estado === 'Prestado' && orden.fecha_entrega) {
      const fechaEntrega = dayjs(orden.fecha_entrega);
      return dayjs().diff(fechaEntrega, 'hour') >= 48;
    }
    return false;
  }

  // Función para filtrar órdenes
  const ordenesFiltradas = ordenes.filter(orden => {
    // 1. Filtro por defecto: solo últimos 30 días (a menos que se aplique filtro de tiempo)
    const fechaLimite30Dias = dayjs().subtract(30, 'day');
    const esOrdenReciente = dayjs(orden.fecha_reserva).isAfter(fechaLimite30Dias);
    
    // Si no hay filtros de tiempo aplicados, solo mostrar órdenes recientes
    if (!filtroAccion && !filtroEstado && !searchTerm) {
      return esOrdenReciente;
    }
    
    // 2. Filtro por estado
    if (filtroEstado && orden.estado !== filtroEstado) {
      return false;
    }
    
    // 3. Filtro por acción (tiempo)
    if (filtroAccion) {
      switch (filtroAccion) {
        case 'ultimas_24h':
          const fechaReserva24h = dayjs().subtract(24, 'hour');
          return dayjs(orden.fecha_reserva).isAfter(fechaReserva24h);
        case 'ultimas_48h':
          const fechaReserva48h = dayjs().subtract(48, 'hour');
          return dayjs(orden.fecha_reserva).isAfter(fechaReserva48h);
        case 'ultimos_7dias':
          const fechaReserva7dias = dayjs().subtract(7, 'day');
          return dayjs(orden.fecha_reserva).isAfter(fechaReserva7dias);
        default:
          return true;
      }
    }
    
    // 4. Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      switch (searchBy) {
        case 'usuario':
          return orden.usuarios?.correo?.toLowerCase().includes(term) ||
                 orden.usuarios?.nombre?.toLowerCase().includes(term);
        case 'libro':
          return orden.Libros?.titulo?.toLowerCase().includes(term);
        case 'fecha':
          if (searchTerm) {
            const fechaBusqueda = dayjs(searchTerm);
            const fechaOrden = dayjs(orden.fecha_reserva);
            return fechaOrden.isSame(fechaBusqueda, 'day');
          }
          return true;
        default:
          return true;
      }
    }
    
    return true;
  });
  
  // Paginación
  const totalPages = Math.ceil(ordenesFiltradas.length / ordersPerPage);
  const paginatedOrders = ordenesFiltradas.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );

  // Obtener funciones del layout para actualizar notificaciones
  const { handleMorosoDesbloqueado, handlePedidoRespondido } = useOutletContext<any>() || {};

  // Función para ejecutar verificación manual de vencimientos
  const ejecutarVerificacionManual = async () => {
    try {
      setLoading(true);
      
      // Ejecutar verificación de vencimientos usando SQL directo
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: 'Cancelado' })
        .eq('estado', 'Pendiente de buscar')
        .lt('fecha_limite_busqueda', new Date().toISOString());
        
      if (error) {
        console.error('Error al verificar vencimientos de búsqueda:', error);
      } else {
        console.log('Vencimientos de búsqueda verificados');
      }
      
      // Verificar vencimientos de devolución y marcar como moroso
      const { error: errorDevolucion } = await supabase
        .from('ordenes')
        .update({ estado: 'Moroso' })
        .eq('estado', 'Prestado')
        .lt('fecha_limite_devolucion', new Date().toISOString());
        
      if (errorDevolucion) {
        console.error('Error al verificar vencimientos de devolución:', errorDevolucion);
      } else {
        console.log('Vencimientos de devolución verificados');
      }

      // Actualizar estado de usuarios que tienen órdenes morosas
      const { data: ordenesMorosas, error: errorUsuarios } = await supabase
        .from('ordenes')
        .select('usuario_id')
        .eq('estado', 'Moroso');

      if (!errorUsuarios && ordenesMorosas) {
        // Obtener IDs únicos de usuarios con órdenes morosas (filtrar nulls)
        const usuariosMorosos = [...new Set(ordenesMorosas.map(o => o.usuario_id).filter(id => id !== null))];
        
        if (usuariosMorosos.length > 0) {
          // Marcar usuarios como morosos
          const { error: errorUpdateUsuarios } = await supabase
            .from('usuarios')
            .update({ estado: 'Moroso' })
            .in('id', usuariosMorosos);
            
          if (errorUpdateUsuarios) {
            console.error('Error al actualizar estado de usuarios morosos:', errorUpdateUsuarios);
          } else {
            console.log('Usuarios marcados como morosos:', usuariosMorosos);
          }
        }
      }

      // Recargar datos
      const fetchOrdenes = async () => {
        setLoading(true);
        setError(null);
        // Traer órdenes de libros físicos y unir con Libros y Usuarios
        const { data, error } = await supabase
          .from('ordenes')
          .select('id, libro_id, usuario_id, estado, fecha_reserva, fecha_entrega, fecha_devolucion, fecha_limite_busqueda, fecha_limite_devolucion, Libros(titulo), usuarios(correo, nombre)')
          .order('fecha_reserva', { ascending: false });
        if (error) {
          console.error('Error Supabase:', error);
          setError('Error al obtener órdenes');
          setOrdenes([]);
        } else {
          setOrdenes(data || []);
        }
        setLoading(false);
      };

      await fetchOrdenes();
      
      setMsg('Verificación de vencimientos ejecutada correctamente');
      setTimeout(() => setMsg(null), 3000);
      
    } catch (error) {
      console.error('Error al ejecutar verificación manual:', error);
      setMsg('Error al ejecutar verificación');
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Contadores para resumen superior
  const morososCount = ordenes.filter(o => o.estado === 'Moroso').length;
  const pendientesCount = ordenes.filter(o => o.estado === 'Pendiente de buscar').length;
  const completadosCount = ordenes.filter(o => o.estado === 'Completado').length;
  const [msg, setMsg] = useState<string|null>(null);

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-8 bg-gray-50">
      {/* Resumen superior */}
      <div className="flex gap-6 justify-center mb-8">

        <div className="flex flex-col items-center bg-white rounded-lg shadow p-4 w-32">
          <span className="text-2xl">🔴</span>
          <span className="text-2xl font-bold">{morososCount}</span>
          <span className="text-sm text-gray-700">Órdenes Morosas</span>
        </div>
        <div className="flex flex-col items-center bg-white rounded-lg shadow p-4 w-32">
          <span className="text-2xl">🟡</span>
          <span className="text-2xl font-bold">{pendientesCount}</span>
          <span className="text-sm text-gray-700">Pendientes</span>
        </div>
        <div className="flex flex-col items-center bg-white rounded-lg shadow p-4 w-32">
          <span className="text-2xl">🟢</span>
          <span className="text-2xl font-bold">{completadosCount}</span>
          <span className="text-sm text-gray-700">Completados</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center">Reportes</h1>
        <button
          onClick={ejecutarVerificacionManual}
          disabled={loading}
          className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Verificando...' : 'Verificar Vencimientos'}
        </button>
      </div>
      {/* Sección 1: Historial de libros */}
      <div className="bg-white rounded shadow p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Historial de Libros</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="p-2">Fecha</th>
                <th className="p-2">Acción</th>
                <th className="p-2">Título</th>
                <th className="p-2">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {/* Este bloque ahora es solo para demostración */}
            </tbody>
          </table>
        </div>
      </div>
      {/* Sección 2: Historial de órdenes de libros físicos */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Historial de Órdenes de Libros Físicos</h2>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            {/* Búsqueda */}
            <div className="flex gap-2">
              <select
                className="border rounded px-3 py-1 text-sm bg-white"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="usuario">Buscar por usuario</option>
                <option value="libro">Buscar por libro</option>
                <option value="fecha">Buscar por fecha</option>
              </select>
              {searchBy === 'fecha' ? (
                <input
                  type="date"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded px-3 py-1 text-sm w-40"
                />
              )}
            </div>
            
            {/* Filtro por estado */}
            <select
              className="border rounded px-3 py-1 text-sm bg-white"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            
            {/* Filtro por acción */}
            <select
              className="border rounded px-3 py-1 text-sm bg-white"
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
            >
              <option value="">Todas las acciones</option>
              <option value="ultimas_24h">Últimas 24 horas</option>
              <option value="ultimas_48h">Últimas 48 horas</option>
              <option value="ultimos_7dias">Últimos 7 días</option>
            </select>
            
            {/* Botón limpiar filtros */}
            <button
              onClick={() => {
                setFiltroEstado('');
                setFiltroAccion('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="bg-gray-500 text-white rounded px-3 py-1 text-sm hover:bg-gray-600"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Cargando órdenes...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100">
                  <th className="p-2">Fecha de pedido</th>
                  <th className="p-2">Libro</th>
                  <th className="p-2">Usuario</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Fechas</th>
                  <th className="p-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      {filtroEstado || filtroAccion ? 'No se encontraron órdenes con los filtros aplicados' : 'No hay órdenes disponibles'}
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((item, idx) => (
                    <tr key={idx} className={`border-b ${requiereAtencion(item) ? 'bg-yellow-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-cyan-50`}>
                      <td className="p-2">{item.fecha_reserva ? item.fecha_reserva.substring(0, 10) : ''}</td>
                      <td className="p-2">{item.Libros?.titulo || item.libro_id}</td>
                      <td className="p-2">
                        <div className="text-xs">
                          <div className="font-medium">{item.usuarios?.correo || 'N/A'}</div>
                          <div className="text-gray-500">{item.usuarios?.nombre || 'Sin nombre'}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${estadoBadge[item.estado as EstadoReserva] || 'bg-gray-300 text-gray-700'}`}>
                          {estadoIcon[item.estado as EstadoReserva] || '❔'} {item.estado}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="text-xs space-y-1">
                          {item.fecha_entrega && (
                            <div className="text-blue-600">
                              📤 Entrega: {item.fecha_entrega.substring(0, 10)}
                            </div>
                          )}
                          {item.fecha_devolucion && (
                            <div className="text-green-600">
                              📥 Devolución: {item.fecha_devolucion.substring(0, 10)}
                            </div>
                          )}
                          {!item.fecha_entrega && item.estado === 'Prestado' && (
                            <div className="text-orange-600">⚠️ Sin fecha de entrega</div>
                          )}
                          {!item.fecha_devolucion && item.estado === 'Completado' && (
                            <div className="text-orange-600">⚠️ Sin fecha de devolución</div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 flex gap-2 justify-center">
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={item.estado}
                          onChange={e => updateOrdenEstado(item.id, e.target.value)}
                        >
                          {ESTADOS.map(estado => (
                            <option key={estado} value={estado}>{estado}</option>
                          ))}
                        </select>
                        {requiereAtencion(item) && (
                          <span className="ml-2 text-xs text-orange-600 font-bold">¡Requiere atención!</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginación */}
        {ordenesFiltradas.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {((currentPage - 1) * ordersPerPage) + 1} - {Math.min(currentPage * ordersPerPage, ordenesFiltradas.length)} de {ordenesFiltradas.length} órdenes
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Anterior
              </button>
              
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Siguiente
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Por página:</span>
              <select
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notificaciones flotantes */}
      <div className="fixed top-20 right-6 flex flex-col gap-2 z-50">
        {morososCount > 0 && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-lg font-bold shadow-lg" title="Órdenes morosas">{morososCount}</span>
        )}
        {pendientesCount > 0 && (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400 text-gray-800 text-lg font-bold shadow-lg" title="Pedidos por responder">{pendientesCount}</span>
        )}
      </div>
      {/* Mensaje de feedback */}
      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in">
          {msg}
        </div>
      )}
      <div className="bg-white rounded shadow p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Reporte de Libros Más Descargados</h2>
        <p className="text-gray-600">Visualiza los libros más populares según descargas. (Próximamente)</p>
      </div>
    </div>
  );
};

export default AdminReportsPage; 