# Biblioteca Digital - Universidad

Sistema de gestión de biblioteca digital desarrollado con React, TypeScript y Supabase.

## 🚀 Características

- **Gestión de libros físicos y digitales**
- **Sistema de reservas y préstamos**
- **Acceso a tesis y proyectos de investigación**
- **Panel de administración**
- **Autenticación de usuarios**
- **Control de morosidad**

## 🛠️ Tecnologías

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Routing:** React Router DOM
- **Animaciones:** Framer Motion

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## ⚙️ Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd BibliotecaFinal
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crear un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_API_KEY=tu_api_key_aqui
   VITE_PROJECT_URL_SUPABASE=tu_url_del_proyecto_aqui
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## 🗄️ Estructura de la Base de Datos

El proyecto utiliza las siguientes tablas en Supabase:
- `usuarios` - Información de usuarios
- `Libros` - Catálogo de libros
- `libros_autores` - Relación libros-autores
- `libros_fisicos` - Inventario de libros físicos
- `libros_virtuales` - Archivos digitales
- `ordenes` - Sistema de préstamos y reservas
- `tesis` - Proyectos de investigación

## 📱 Funcionalidades

### Para Estudiantes/Docentes
- Explorar catálogo de libros
- Reservar libros físicos
- Acceder a tesis digitales
- Ver historial de préstamos
- Sistema de búsqueda avanzada

### Para Administradores
- Panel de estadísticas
- Gestión de libros
- Reportes de préstamos
- Control de usuarios

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Verificar código

## 🐛 Solución de Problemas

### Error de configuración de Supabase
Si ves un mensaje de error de configuración:
1. Verifica que el archivo `.env` existe
2. Confirma que las variables de entorno son correctas
3. Reinicia el servidor de desarrollo

### Problemas de conexión
- Verifica tu conexión a internet
- Confirma que las credenciales de Supabase son válidas
- Revisa la consola del navegador para errores específicos

## 📄 Licencia

Este proyecto es de uso interno para la universidad. 