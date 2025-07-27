-- Script para actualizar la especialidad "Ingenieria en Sistemas" a "Ingenieria De Sistemas"
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué libros tienen la especialidad antigua
SELECT id_libro, titulo, especialidad 
FROM "Libros" 
WHERE especialidad = 'Ingenieria en Sistemas';

-- 2. Actualizar todos los libros con la especialidad antigua
UPDATE "Libros" 
SET especialidad = 'Ingenieria De Sistemas' 
WHERE especialidad = 'Ingenieria en Sistemas';

-- 3. Verificar que se actualizaron correctamente
SELECT id_libro, titulo, especialidad 
FROM "Libros" 
WHERE especialidad = 'Ingenieria De Sistemas';

-- 4. Verificar que no quedan libros con la especialidad antigua
SELECT COUNT(*) as libros_con_especialidad_antigua
FROM "Libros" 
WHERE especialidad = 'Ingenieria en Sistemas';

-- 5. Mostrar todas las especialidades únicas para verificar
SELECT DISTINCT especialidad 
FROM "Libros" 
ORDER BY especialidad; 