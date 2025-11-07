# Biblioteca TP Final

Proyecto desarrollado por Gonzalo Peralta, Leandro Viscolungo y Rubén Moyano como Trabajo Práctico Final de la materia Programación II.

Esta aplicación web permite gestionar y visualizar información de una biblioteca, utilizando tecnologías modernas.

## Funcionalidades principales

- Registro, edición y eliminación de usuarios (clientes y administradores)
- Gestión de préstamos de libros y control de devoluciones
- Registro y edición de libros en el inventario
- Filtros y búsqueda avanzada de usuarios y libros
- Reportes de actividad y estadísticas
- Roles y permisos diferenciados (admin/cliente)
- Autenticación y protección de rutas
- Validaciones de negocio: los administradores no pueden tener préstamos ni ser inactivos
- Cambio de contraseña para administradores

## Tecnologías utilizadas

- **Next.js** (App Router)
- **React**
- **Prisma ORM**
- **PostgreSQL** (o base compatible)
- **Tailwind CSS**
- **Radix UI**
- **Lucide React** (iconos)
- **TypeScript**
- **Sonner** (notificaciones)
- **Copilot, ChatGPT y Claude** (asistentes de IA para desarrollo y debugging)

## Errores resueltos

- Corrección de validaciones de email y duplicados
- Manejo de errores de conexión a la base de datos
- Solución a problemas de borrado lógico vs. borrado real de usuarios
- Ajuste de reglas de negocio para roles admin/cliente
- Corrección de bugs en la edición de usuarios y préstamos
- Manejo de estados de carga y feedback visual
- Simulación de errores de migración y seed de datos
- Resolución de conflictos de dependencias y tipado TypeScript

## Instrucciones para ejecutar el proyecto

1. Clonar o descargar el repositorio.
2. Instalar las dependencias:

	```bash
	npm install
	```

3. Generar el cliente de Prisma:

	```bash
	npx prisma generate
	```

4. Copiar el archivo `.env` en la raíz del proyecto y configurar las variables necesarias (por ejemplo, la URL de la base de datos PostgreSQL).


---
**Nota:** El comando siguiente solo se debe usar si necesitas reiniciar la base de datos y cargar nuevamente los datos de prueba (mock data). Por defecto, la base ya está limpia y con los datos cargados.

	```bash
	npx prisma migrate reset
	```

	Esto ejecutará las migraciones y el seed de datos automáticamente.

5. Iniciar el servidor de desarrollo:

	```bash
	npm run dev
	```

6. Acceder a la aplicación en [http://localhost:3000](http://localhost:3000)

**Usuario admin por defecto:**

- Email: `admin@admin.com`
- Contraseña: `admin`

---
> Proyecto desarrollado con el apoyo de herramientas de IA: GitHub Copilot, ChatGPT y Claude, para acelerar la escritura de código, depuración y documentación.