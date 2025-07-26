import { supabase } from '../supabase/client';

export const fetchBooks = async () => {
  try {
    // Verificar que Supabase esté configurado
    const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
    const supabaseUrl = import.meta.env.VITE_PROJECT_URL_SUPABASE;
    
    if (!supabaseKey || !supabaseUrl || supabaseKey === 'undefined' || supabaseUrl === 'undefined') {
      throw new Error('Supabase no está configurado correctamente');
    }

    // Traer libros y, si es tesis, buscar su PDF en libros_virtuales
    const { data, error } = await supabase
      .from('Libros')
      .select('id_libro, titulo, fecha_publicacion, sinopsis, url_portada, tipo, especialidad, libros_autores(autor:autor_id(nombre)), libros_virtuales:libros_virtuales(direccion_del_libro), libros_fisicos(cantidad)');
    
    if (error) {
      console.error('Error al obtener libros:', error);
      throw new Error('Error al cargar los libros desde la base de datos');
    }

    console.log('[IA] Datos crudos de libros desde la BDD:', data);

    return (data || []).map((book: any) => {
      // Si es tesis, buscar el PDF en libros_virtuales
      let fileUrl = '';
      if (book.tipo === 'Tesis' && book.libros_virtuales && book.libros_virtuales.length > 0) {
        const rawUrl = book.libros_virtuales[0].direccion_del_libro;
        // Si la URL ya es pública, usarla tal cual. Si es solo la ruta, construir la URL pública.
        if (rawUrl && rawUrl.startsWith('http')) {
          fileUrl = rawUrl;
        } else if (rawUrl) {
          // Construir la URL pública
          fileUrl = `https://ueufprdedokleqlyooyq.supabase.co/storage/v1/object/public/${rawUrl}`;
        }
      }
      // Obtener cantidad disponible de libros físicos (si aplica)
      let cantidadDisponible = undefined;
      
      if (book.tipo === 'Físico' && book.libros_fisicos && book.libros_fisicos.length > 0) {
        cantidadDisponible = book.libros_fisicos[0].cantidad;
      } else if (book.tipo === 'Fisico' && book.libros_fisicos && book.libros_fisicos.length > 0) {
        cantidadDisponible = book.libros_fisicos[0].cantidad;
      }
      return {
        id: book.id_libro,
        title: book.titulo,
        authors: book.libros_autores && book.libros_autores.length > 0
          ? book.libros_autores.map((a: any) => a.autor.nombre).join(', ')
          : 'Desconocido',
        author: book.libros_autores && book.libros_autores.length > 0
          ? book.libros_autores[0].autor.nombre
          : 'Desconocido',
        slug: book.titulo.toLowerCase().replace(/\s+/g, '-'),
        features: [],
        description: { content: [{ type: 'paragraph', content: [{ type: 'text', text: book.sinopsis || '' }] }] },
        coverImage: book.url_portada,
        created_at: book.fecha_publicacion,
        price: 0,
        type: book.tipo,
        speciality: book.especialidad || '',
        fragment: '',
        fileUrl,
        sinopsis: book.sinopsis || '',
        cantidadDisponible,
      };
    });
  } catch (error) {
    console.error('Error en fetchBooks:', error);
    throw error;
  }
};

export const registerBookReservation = async ({ libro_id, usuario_id }: { libro_id: number, usuario_id: number }) => {
  try {
    // 1. Verificar que el usuario no esté moroso
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('estado')
      .eq('id', usuario_id)
      .single();
      
    if (userError) {
      throw new Error('Error al verificar el estado del usuario');
    }
    
    if (usuario?.estado === 'Moroso') {
      throw new Error('Usted se encuentra bloqueado por morosidad. No puede realizar reservas.');
    }

    // 2. Verificar stock disponible
    const { data: libroFisico, error: stockError } = await supabase
      .from('libros_fisicos')
      .select('cantidad')
      .eq('libro_id', libro_id)
      .single();
      
    if (stockError) {
      throw new Error('Error al verificar disponibilidad del libro');
    }
    
    if (!libroFisico || libroFisico.cantidad <= 0) {
      throw new Error('No hay ejemplares disponibles en este momento');
    }

    // 3. Verificar que no tenga una orden activa para el mismo libro
    const { data: ordenesExistentes, error: ordenError } = await supabase
      .from('ordenes')
      .select('id, estado')
      .eq('usuario_id', usuario_id)
      .eq('libro_id', libro_id)
      .in('estado', ['Pendiente de buscar', 'Prestado', 'Moroso']);
      
    if (ordenError) {
      throw new Error('Error al verificar órdenes existentes');
    }
    
    if (ordenesExistentes && ordenesExistentes.length > 0) {
      const ordenActiva = ordenesExistentes[0];
      throw new Error(`Ya tiene una orden activa para este libro (Estado: ${ordenActiva.estado}). Debe completar o cancelar la orden anterior antes de reservar nuevamente.`);
    }

    // 4. Crear la orden (el trigger automáticamente reducirá el stock y establecerá fechas límite)
    const fechaReserva = new Date().toISOString();
    const ordenObj = {
      libro_id,
      usuario_id,
      estado: 'Pendiente de buscar',
      fecha_reserva: fechaReserva,
      fecha_entrega: null,
      fecha_devolucion: null,
      fecha_limite_busqueda: null, // Se establecerá automáticamente con el trigger
      fecha_limite_devolucion: null,
    };
    
    const { data, error } = await supabase
      .from('ordenes')
      .insert(ordenObj);
      
    if (error) {
      throw new Error('Error al crear la orden de reserva');
    }
    
    return data;
    
  } catch (error) {
    throw error;
  }
}; 