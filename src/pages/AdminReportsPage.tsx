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
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-7xl mx-auto px-2 sm:px-4 lg:px-0">
      {/* Resumen superior - Diseño responsivo con unidades relativas */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-4 mb-4 sm:mb-6 lg:mb-8 pt-2 sm:pt-4 lg:pt-6">
        <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-1 sm:p-2 lg:p-1 min-h-[4rem] sm:min-h-[5rem] lg:min-h-auto flex-shrink-0">
          <span className="text-lg sm:text-xl lg:text-sm mb-0">🔴</span>
          <span className="text-lg sm:text-xl lg:text-base font-bold text-red-600 mb-0">{morososCount}</span>
          <span className="text-xs sm:text-sm text-gray-700 text-center leading-tight">Morosas</span>
        </div>
        <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-1 sm:p-2 lg:p-1 min-h-[4rem] sm:min-h-[5rem] lg:min-h-auto flex-shrink-0">
          <span className="text-lg sm:text-xl lg:text-sm mb-0">🟡</span>
          <span className="text-lg sm:text-xl lg:text-base font-bold text-yellow-600 mb-0">{pendientesCount}</span>
          <span className="text-xs sm:text-sm text-gray-700 text-center leading-tight">Pendientes</span>
        </div>
        <div className="flex flex-col items-center bg-white rounded-lg shadow-md p-1 sm:p-2 lg:p-1 min-h-[4rem] sm:min-h-[5rem] lg:min-h-auto flex-shrink-0">
          <span className="text-lg sm:text-xl lg:text-sm mb-0">🟢</span>
          <span className="text-lg sm:text-xl lg:text-base font-bold text-green-600 mb-0">{completadosCount}</span>
          <span className="text-xs sm:text-sm text-gray-700 text-center leading-tight">Completados</span>
        </div>
      </div>
      {/* Header responsivo con navegación adaptativa */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4 lg:mb-6 gap-2 sm:gap-4">
        <h1 className="text-lg sm:text-xl lg:text-lg font-bold text-center sm:text-left text-gray-800 w-full sm:w-auto">Reportes</h1>
        <button
          onClick={ejecutarVerificacionManual}
          disabled={loading}
          className="w-full sm:w-auto px-3 sm:px-4 lg:px-3 py-2 sm:py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-xs transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-4 h-4 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="whitespace-nowrap">{loading ? 'Verificando...' : 'Verificar Vencimientos'}</span>
        </button>
      </div>
      {/* Sección 1: Historial de libros - Layout responsivo */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-4 mb-4 sm:mb-5 lg:mb-6">
        <h2 className="text-base sm:text-lg lg:text-base font-bold mb-3 sm:mb-4 lg:mb-3 text-gray-800">Historial de Libros</h2>
        <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
          <div className="min-w-full inline-block align-middle">
            <div className="overflow-hidden">
              <table className="w-full text-sm sm:text-base lg:text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>
                    <th className="px-2 sm:px-3 lg:p-2 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-2 sm:px-3 lg:p-2 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Acción</th>
                    <th className="px-2 sm:px-3 lg:p-2 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Título</th>
                    <th className="px-2 sm:px-3 lg:p-2 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Este bloque ahora es solo para demostración */}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Sección 2: Historial de órdenes - Filtros responsivos */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-4 mb-4 sm:mb-5 lg:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg lg:text-base font-bold text-gray-800 w-full sm:w-auto">Historial de Órdenes de Libros Físicos</h2>
          
          {/* Filtros responsivos con Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2 sm:gap-3 w-full sm:w-auto">
            <select
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
            >
              <option value="usuario">Usuario</option>
              <option value="libro">Libro</option>
              <option value="fecha">Fecha</option>
            </select>
            {searchBy === 'fecha' ? (
              <input
                type="date"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            ) : (
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            )}
            <select
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Estado</option>
              {ESTADOS.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
            >
              <option value="">Período</option>
              <option value="ultimas_24h">24h</option>
              <option value="ultimas_48h">48h</option>
              <option value="ultimos_7dias">7 días</option>
            </select>
            <button
              onClick={() => {
                setFiltroEstado('');
                setFiltroAccion('');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="bg-gray-500 text-white rounded px-1 py-0.5 text-xs hover:bg-gray-600 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Cargando órdenes...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {paginatedOrders.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                {filtroEstado || filtroAccion ? 'No se encontraron órdenes con los filtros aplicados' : 'No hay órdenes disponibles'}
              </div>
            ) : (
              paginatedOrders.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`bg-white rounded-lg shadow-md p-3 cursor-pointer transition-all hover:shadow-lg ${
                    requiereAtencion(item) ? 'border-2 border-yellow-400' : 'border border-gray-200'
                  }`}
                  onClick={() => setSelectedOrder(item)}
                >
                  {/* Usuario */}
                  <div className="mb-2">
                    <div className="font-medium text-sm text-gray-800 truncate">
                      {item.usuarios?.correo || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.usuarios?.nombre || 'Sin nombre'}
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${estadoBadge[item.estado as EstadoReserva] || 'bg-gray-300 text-gray-700'}`}>
                      {estadoIcon[item.estado as EstadoReserva] || '❔'} {item.estado}
                    </span>
                  </div>
                  
                  {/* Libro */}
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 font-medium truncate">
                      {item.Libros?.titulo || item.libro_id}
                    </div>
                  </div>
                  
                  {/* Fecha */}
                  <div className="text-xs text-gray-500">
                    {item.fecha_reserva ? item.fecha_reserva.substring(0, 10) : 'Sin fecha'}
                  </div>
                  
                  {/* Indicador de atención */}
                  {requiereAtencion(item) && (
                    <div className="mt-2 text-xs text-orange-600 font-bold">
                      ⚠️ Requiere atención
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Paginación ultra compacta */}
        {ordenesFiltradas.length > 0 && (
          <div className="mt-3 flex flex-col lg:flex-row justify-between items-center gap-2">
            <div className="text-xs text-gray-600">
              {((currentPage - 1) * ordersPerPage) + 1} - {Math.min(currentPage * ordersPerPage, ordenesFiltradas.length)} de {ordenesFiltradas.length}
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-1 py-0.5 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                ←
              </button>
              
              <span className="text-xs font-medium">
                {currentPage}/{totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-1 py-0.5 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              >
                →
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-600">Por página:</span>
              <select
                value={ordersPerPage}
                onChange={(e) => {
                  setOrdersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-1 py-0.5 text-xs bg-white"
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


      {/* Notificaciones flotantes - Solo desktop */}
      <div className="hidden lg:flex fixed top-20 right-6 flex-col gap-2 z-50">
        {morososCount > 0 && (
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white text-lg font-bold shadow-lg" title="Órdenes morosas">{morososCount}</span>
        )}
        {pendientesCount > 0 && (
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-400 text-gray-800 text-lg font-bold shadow-lg" title="Pedidos por responder">{pendientesCount}</span>
        )}
      </div>

      {/* Mensaje de feedback */}
      {msg && (
        <div className="fixed bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg shadow-lg z-50 animate-fade-in text-sm lg:text-base max-w-xs lg:max-w-md text-center">
          {msg}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-3 lg:p-4 mt-4 lg:mt-6">
        <h2 className="text-sm lg:text-base font-bold mb-2 lg:mb-3 text-gray-800">Reporte de Libros Más Descargados</h2>
        <p className="text-gray-600 text-xs">Visualiza los libros más populares según descargas. (Próximamente)</p>
      </div>

      {/* Modal de detalles de orden */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Detalles de Orden</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Usuario */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Usuario</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium">{selectedOrder.usuarios?.correo || 'N/A'}</div>
                  <div className="text-sm text-gray-600">{selectedOrder.usuarios?.nombre || 'Sin nombre'}</div>
                </div>
              </div>
              
              {/* Libro */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Libro</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium">{selectedOrder.Libros?.titulo || selectedOrder.libro_id}</div>
                </div>
              </div>
              
              {/* Estado */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Estado</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${estadoBadge[selectedOrder.estado as EstadoReserva] || 'bg-gray-300 text-gray-700'}`}>
                    {estadoIcon[selectedOrder.estado as EstadoReserva] || '❔'} {selectedOrder.estado}
                  </span>
                  <select
                    className="border rounded px-2 py-1 text-sm bg-white"
                    value={selectedOrder.estado}
                    onChange={e => {
                      updateOrdenEstado(selectedOrder.id, e.target.value);
                      setSelectedOrder({...selectedOrder, estado: e.target.value});
                    }}
                  >
                    {ESTADOS.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Fechas */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Fechas</h4>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Reserva:</span> {selectedOrder.fecha_reserva ? selectedOrder.fecha_reserva.substring(0, 10) : 'Sin fecha'}
                  </div>
                  {selectedOrder.fecha_entrega && (
                    <div className="text-sm text-blue-600">
                      <span className="font-medium">📤 Entrega:</span> {selectedOrder.fecha_entrega.substring(0, 10)}
                    </div>
                  )}
                  {selectedOrder.fecha_devolucion && (
                    <div className="text-sm text-green-600">
                      <span className="font-medium">📥 Devolución:</span> {selectedOrder.fecha_devolucion.substring(0, 10)}
                    </div>
                  )}
                  {!selectedOrder.fecha_entrega && selectedOrder.estado === 'Prestado' && (
                    <div className="text-sm text-orange-600">⚠️ Sin fecha de entrega</div>
                  )}
                  {!selectedOrder.fecha_devolucion && selectedOrder.estado === 'Completado' && (
                    <div className="text-sm text-orange-600">⚠️ Sin fecha de devolución</div>
                  )}
                </div>
              </div>
              
              {/* Indicador de atención */}
              {requiereAtencion(selectedOrder) && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <div className="text-sm text-yellow-800 font-bold">
                    ⚠️ Esta orden requiere atención especial
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage; 