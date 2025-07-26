import { createClient } from "@supabase/supabase-js";
import { Database } from "../supabase/supabase";

export interface LoginData {
  correo: string;
  contraseña: string;
}

export interface RegisterData {
  nombre: string;
  correo: string;
  contraseña: string;
  escuela: string | null;
}

export interface User {
  id: number;
  nombre: string;
  correo: string;
  escuela: string | null;
  rol?: string;
  estado?: string | null; // Activo, Moroso, etc.
}

const createSupabaseClient = () => {
  const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
  const supabaseUrl = import.meta.env.VITE_PROJECT_URL_SUPABASE;

  if (!supabaseKey || !supabaseUrl) {
    console.warn('Variables de entorno de Supabase no configuradas');
    return null;
  }

  try {
    return createClient<Database>(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Error al crear cliente de Supabase:', error);
    return null;
  }
};

const supabase = createSupabaseClient();

export const authService = {
  // Verificar si un email ya existe
  async checkEmailExists(email: string): Promise<{ exists: boolean; error: any }> {
    if (!supabase) {
      return { exists: false, error: 'Supabase no configurado' };
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('correo')
        .eq('correo', email)
        .single();

      return { exists: !!data, error };
    } catch (error) {
      return { exists: false, error };
    }
  },

  // Registrar un nuevo usuario
  async registerUser(userData: RegisterData): Promise<{ data: User | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase no configurado' };
    }

    try {
      // Agregar estado por defecto 'Activo' al registrar
      const userDataWithEstado = {
        ...userData,
        estado: 'Activo' // Establecer estado por defecto
      };

      const { data, error } = await supabase
        .from('usuarios')
        .insert([userDataWithEstado])
        .select('id, nombre, correo, escuela, rol, estado')
        .single();


      return { data: data as User | null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Autenticar usuario
  async loginUser(loginData: LoginData): Promise<{ data: User | null; error: any }> {
    if (!supabase) {
      return { data: null, error: 'Supabase no configurado' };
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, correo, escuela, rol, estado')
        .eq('correo', loginData.correo)
        .eq('contraseña', loginData.contraseña)
        .single();

      return { data: data as User | null, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  },

  // Obtener usuario actual desde localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Guardar usuario en localStorage
  setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Verificar si Supabase está configurado
  isConfigured(): boolean {
    return supabase !== null;
  }
}; 