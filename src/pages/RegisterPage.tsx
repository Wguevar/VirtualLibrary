import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { validation } from '../utils/validation';

const specialities = [
  'Ingeniería en Sistemas',
  'Ingeniería Civil',
  'Ingeniería Industrial',
  'Ingeniería Eléctrica',
  'Ingeniería En Mantenimiento Mecánico',
  'Ingeniería Electrónica',
];

export const RegisterPage = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [escuela, setEscuela] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();
  const { register, loading, error, clearError, isConfigured } = useAuth();

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validar nombre
    const nombreError = validation.getNombreError(nombre);
    if (nombreError) newErrors.nombre = nombreError;

    // Validar email
    const emailError = validation.getEmailError(email);
    if (emailError) newErrors.email = emailError;

    // Validar escuela
    const escuelaError = validation.getEscuelaError(escuela);
    if (escuelaError) newErrors.escuela = escuelaError;

    // Validar contraseña
    const passwordError = validation.getPasswordError(password);
    if (passwordError) newErrors.password = passwordError;

    // Validar confirmar contraseña
    const confirmPasswordError = validation.getConfirmPasswordError(password, confirmPassword);
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    const result = await register({
      nombre,
      correo: email,
      contraseña: password,
      escuela: escuela || null,
    });

    if (result.success) {
      // Pequeño delay y recarga para asegurar que el estado se actualice
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* Fondo de imagen */}
      <div className="fixed inset-0 bg-cover bg-center z-[-1]" style={{ backgroundImage: 'url(/img/Estantes_biblioteca.jpg)' }} />
      <form
        onSubmit={handleRegister}
        className="relative z-10 bg-white p-8 rounded shadow-lg shadow-gray-400 w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Registro</h2>
        
        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-700">
              <strong>Modo simulado:</strong> El sistema de autenticación no está configurado. 
              Los datos se simularán localmente.
            </p>
          </div>
        )}
        
        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={e => {
            setNombre(e.target.value);
            handleInputChange('nombre', e.target.value);
          }}
          className={`border p-2 rounded w-full ${errors.nombre ? 'border-red-500' : ''}`}
          required
        />
        {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            handleInputChange('email', e.target.value);
          }}
          className={`border p-2 rounded w-full ${errors.email ? 'border-red-500' : ''}`}
          required
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <select
          value={escuela}
          onChange={e => {
            setEscuela(e.target.value);
            handleInputChange('escuela', e.target.value);
          }}
          className={`border p-2 rounded w-full ${errors.escuela ? 'border-red-500' : ''}`}
          required
        >
          <option value="">Selecciona tu especialidad</option>
          {specialities.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.escuela && <p className="text-red-500 text-sm">{errors.escuela}</p>}

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            handleInputChange('password', e.target.value);
          }}
          className={`border p-2 rounded w-full ${errors.password ? 'border-red-500' : ''}`}
          required
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={e => {
            setConfirmPassword(e.target.value);
            handleInputChange('confirmPassword', e.target.value);
          }}
          className={`border p-2 rounded w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
          required
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        
        <button
          type="button"
          className="text-blue-600 underline text-sm mt-2"
          onClick={() => navigate('/login')}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </form>
    </div>
  );
}; 