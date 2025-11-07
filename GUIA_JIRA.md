# Guía para Cargar el Proyecto Biblioteca en Jira

## 📋 Pasos Básicos

### 1. Crear el Proyecto en Jira
1. Ir a Jira → "Crear Proyecto"
2. Seleccionar plantilla "Scrum" o "Kanban"
3. Nombre: **Sistema de Gestión de Biblioteca**
4. Clave del proyecto: **BIB**

---

## 🎯 Estructura Recomendada

### PASO 1: Crear las Épicas (4 épicas principales)

Las épicas son las grandes áreas funcionales. Crear en este orden:

1. **EPIC-1: Autenticación y Seguridad**
   - Resumen: "Sistema de autenticación para administradores"
   - Descripción: Control de acceso y gestión de sesiones

2. **EPIC-2: Gestión de Libros**
   - Resumen: "CRUD completo de libros y catálogo"
   - Descripción: Administración del inventario de libros

3. **EPIC-3: Gestión de Usuarios**
   - Resumen: "CRUD de usuarios y gestión de roles"
   - Descripción: Administración de clientes y administradores

4. **EPIC-4: Sistema de Préstamos**
   - Resumen: "Gestión de préstamos y devoluciones"
   - Descripción: Control de préstamos, multas y fechas de vencimiento

---

### PASO 2: Crear Historias de Usuario (User Stories)

Para cada épica, crear las siguientes historias:

#### 📌 EPIC-1: Autenticación y Seguridad

**BIB-1: Login de Administrador**
- **Como** administrador
- **Quiero** iniciar sesión con email y contraseña
- **Para** acceder al sistema de gestión
- **Criterios de aceptación:**
  - Formulario con email y contraseña
  - Validación de credenciales
  - Redirección al dashboard tras login exitoso
  - Mensaje de error si las credenciales son inválidas

**BIB-2: Protección de Rutas**
- **Como** sistema
- **Quiero** validar que solo usuarios autenticados accedan al dashboard
- **Para** mantener la seguridad del sistema
- **Criterios de aceptación:**
  - Redirección a /login si no hay sesión
  - Persistencia de sesión en localStorage
  - Logout funcional

---

#### 📌 EPIC-2: Gestión de Libros

**BIB-3: Listar Libros**
- **Como** administrador
- **Quiero** ver un listado de todos los libros
- **Para** conocer el inventario disponible
- **Criterios de aceptación:**
  - Tabla con título, autor, ISBN, categoría, año, disponibilidad
  - Mostrar copias disponibles vs total
  - Indicador visual de disponibilidad

**BIB-4: Agregar Libro**
- **Como** administrador
- **Quiero** agregar un nuevo libro al catálogo
- **Para** ampliar el inventario de la biblioteca
- **Criterios de aceptación:**
  - Formulario con: título, autor, ISBN, categoría, año, copias
  - Validación de ISBN único
  - Validación de campos obligatorios
  - Mensaje de confirmación

**BIB-5: Editar Libro**
- **Como** administrador
- **Quiero** modificar la información de un libro
- **Para** corregir errores o actualizar datos
- **Criterios de aceptación:**
  - Pre-cargar datos actuales del libro
  - Validar que el ISBN no se duplique con otro libro
  - Actualización en tiempo real

**BIB-6: Eliminar Libro**
- **Como** administrador
- **Quiero** eliminar un libro del catálogo
- **Para** remover libros obsoletos
- **Criterios de aceptación:**
  - No permitir eliminar libros con préstamos activos
  - Confirmación antes de eliminar
  - Eliminación permanente de la base de datos

**BIB-7: Buscar y Filtrar Libros**
- **Como** administrador
- **Quiero** buscar libros por título, autor o ISBN
- **Para** encontrar rápidamente un libro específico
- **Criterios de aceptación:**
  - Barra de búsqueda funcional
  - Filtro por categoría
  - Búsqueda en tiempo real

---

#### 📌 EPIC-3: Gestión de Usuarios

**BIB-8: Listar Usuarios**
- **Como** administrador
- **Quiero** ver todos los usuarios registrados
- **Para** gestionar la base de usuarios
- **Criterios de aceptación:**
  - Tabla con nombre, email, teléfono, dirección, fecha registro, estado
  - Distinguir entre admin y cliente
  - Indicador visual de usuario activo/inactivo

**BIB-9: Registrar Usuario**
- **Como** administrador
- **Quiero** registrar un nuevo usuario
- **Para** permitirle acceder a los servicios de la biblioteca
- **Criterios de aceptación:**
  - Formulario con: nombre, email, teléfono, dirección, rol
  - Validación de email único
  - Contraseña obligatoria solo para admin
  - Admin siempre activo por defecto

**BIB-10: Editar Usuario**
- **Como** administrador
- **Quiero** modificar datos de un usuario
- **Para** mantener la información actualizada
- **Criterios de aceptación:**
  - Pre-cargar datos actuales
  - Permitir cambio de contraseña (solo admin)
  - No permitir que admin se vuelva inactivo

**BIB-11: Eliminar Usuario**
- **Como** administrador
- **Quiero** eliminar un usuario
- **Para** dar de baja usuarios que ya no usen el servicio
- **Criterios de aceptación:**
  - No permitir eliminar usuarios con préstamos activos
  - No permitir eliminar administradores
  - Confirmación antes de eliminar

**BIB-12: Activar/Desactivar Usuario**
- **Como** administrador
- **Quiero** activar o desactivar un usuario
- **Para** suspender temporalmente el acceso sin eliminarlo
- **Criterios de aceptación:**
  - Toggle switch funcional
  - Solo aplicable a clientes (no admin)
  - Actualización inmediata del estado

**BIB-13: Buscar Usuarios**
- **Como** administrador
- **Quiero** buscar usuarios por nombre, email o teléfono
- **Para** encontrar rápidamente a un usuario
- **Criterios de aceptación:**
  - Barra de búsqueda funcional
  - Filtro por estado (activo/inactivo)
  - Búsqueda en tiempo real

---

#### 📌 EPIC-4: Sistema de Préstamos

**BIB-14: Listar Préstamos**
- **Como** administrador
- **Quiero** ver todos los préstamos
- **Para** monitorear el estado de los libros prestados
- **Criterios de aceptación:**
  - Tabla con: libro, usuario, fecha préstamo, fecha vencimiento, multa, estado
  - Estados: activo, vencido, devuelto
  - Cálculo automático de días restantes/vencidos

**BIB-15: Crear Préstamo**
- **Como** administrador
- **Quiero** registrar un nuevo préstamo
- **Para** entregar libros a los usuarios
- **Criterios de aceptación:**
  - Seleccionar libro disponible
  - Seleccionar usuario activo (no admin)
  - Validar disponibilidad de copias
  - Validar que el usuario no tenga ese mismo libro prestado
  - Período máximo: 30 días
  - Actualizar copias disponibles

**BIB-16: Procesar Devolución**
- **Como** administrador
- **Quiero** registrar la devolución de un libro
- **Para** actualizar el inventario y calcular multas
- **Criterios de aceptación:**
  - Cambiar estado a "devuelto"
  - Calcular multa ($500 por día de retraso)
  - Mostrar mensaje con multa si aplica
  - Incrementar copias disponibles

**BIB-17: Búsqueda de Préstamos**
- **Como** administrador
- **Quiero** buscar préstamos por libro o usuario
- **Para** revisar el historial de préstamos
- **Criterios de aceptación:**
  - Barra de búsqueda funcional
  - Filtro por estado (todos/activos/vencidos/devueltos)
  - Búsqueda en tiempo real

**BIB-18: Dashboard con Estadísticas**
- **Como** administrador
- **Quiero** ver un resumen del sistema
- **Para** tener una visión general de la actividad
- **Criterios de aceptación:**
  - Total de libros y disponibles
  - Total de usuarios y activos
  - Préstamos activos
  - Préstamos vencidos
  - Top 5 libros más prestados
  - Accesos rápidos a funciones principales

---

### PASO 3: Crear Tareas Técnicas (Sub-tasks)

Para cada historia, agregar sub-tareas técnicas. Ejemplos:

**Para BIB-1 (Login):**
- Crear página /login
- Implementar API /api/auth
- Validar credenciales con Prisma
- Implementar localStorage para sesión
- Crear hook useAuthRedirect

**Para BIB-4 (Agregar Libro):**
- Diseñar formulario modal
- Crear validaciones de formulario
- Implementar endpoint POST /api/books
- Validar ISBN único en BD
- Actualizar estado tras agregar

**Para BIB-15 (Crear Préstamo):**
- Crear formulario de préstamo
- Implementar autocomplete de libros
- Implementar autocomplete de usuarios
- Crear endpoint POST /api/loans
- Validar disponibilidad de copias
- Actualizar availableCopies del libro

---

### PASO 4: Crear RFCs (Request for Comments)

Los RFCs son documentos de diseño técnico. Crear al menos 2-3:

**RFC-001: Arquitectura de la Aplicación**
- **Título:** Diseño de arquitectura Next.js con Prisma
- **Problema:** Definir stack tecnológico y estructura del proyecto
- **Solución propuesta:**
  - Next.js 14 con App Router
  - Prisma ORM con PostgreSQL
  - Arquitectura de carpetas: /app, /components, /lib
  - API Routes para backend
- **Decisiones tomadas:**
  - TypeScript para type safety
  - Radix UI + Tailwind para componentes
  - Validaciones del lado del servidor
- **Estado:** APROBADO

**RFC-002: Modelo de Datos y Relaciones**
- **Título:** Diseño del schema de base de datos
- **Problema:** Definir entidades y relaciones del sistema
- **Solución propuesta:**
  ```
  - Book (id, title, author, isbn, category, year, copies)
  - User (id, name, email, phone, address, role, isActive, password?)
  - Loan (id, bookId, userId, loanDate, dueDate, returnDate?, status)
  ```
- **Relaciones:**
  - User 1:N Loan
  - Book 1:N Loan
- **Reglas de negocio:**
  - Admin no puede tener préstamos
  - Admin siempre activo
  - ISBN único
  - Email único
- **Estado:** APROBADO

**RFC-003: Sistema de Cálculo de Multas**
- **Título:** Lógica de multas por retraso
- **Problema:** Definir cómo calcular y mostrar multas
- **Solución propuesta:**
  - Multa: $500 por día de retraso
  - Cálculo automático al devolver
  - Mostrar en tabla de préstamos
  - Sumar total de multas pendientes en dashboard
- **Alternativas consideradas:**
  - Multa progresiva (rechazada)
  - Bloqueo de usuario moroso (futura implementación)
- **Estado:** APROBADO

---

## 🔄 Orden de Implementación Sugerido (para Sprints)

### Sprint 1: Fundación (16-29 Sept 2025)
- ✅ BIB-2: Login de Administrador
- ✅ BIB-3: Protección de rutas
- ✅ BIB-22: Dashboard con Estadísticas

### Sprint 2: Gestión de Libros (30 Sept - 13 Oct 2025)
- ✅ BIB-5: Listar libros
- ✅ BIB-6: Agregar libro
- ✅ BIB-7: Editar libro
- ✅ BIB-8: Eliminar libro
- ✅ BIB-9: Buscar y Filtrar libros

### Sprint 3: Gestión de Usuarios (14-27 Oct 2025)
- ✅ BIB-11: Listar usuarios
- ✅ BIB-12: Registrar usuario
- ✅ BIB-13: Editar usuario
- ✅ BIB-14: Eliminar usuario
- ✅ BIB-15: Activar/Desactivar usuario
- ✅ BIB-16: Buscar usuarios

### Sprint 4: Sistema de Préstamos (28-31 Oct 2025)
- ✅ BIB-18: Listar préstamos
- ✅ BIB-19: Crear préstamo
- ✅ BIB-20: Procesar devolución
- ✅ BIB-21: Buscar préstamos

**Proyecto completado:** 31 de octubre de 2025

---

## 📝 Cómo Cargar en Jira

### Creación Manual ⭐⭐⭐ (RECOMENDADO - MÁS CONFIABLE)

**Crear todo manualmente es más rápido y sin errores de importación.**

## 🚀 PASOS PARA CREAR MANUALMENTE

### 1️⃣ Crear el Proyecto (2 minutos)

1. **Jira Cloud** → Click en **"Create project"** 
2. Seleccionar **"Scrum"** 
3. **IMPORTANTE:** Usar plantilla **"Company-managed"** (NO Team-managed)
   - Team-managed NO tiene Epics
   - Company-managed tiene todas las funcionalidades
4. Configurar:
   - **Name:** Sistema Biblioteca
   - **Key:** BIB
   - **Access:** Quien necesite acceso
5. Click **"Create"**

---

### 2️⃣ Crear las 4 Épicas (5 minutos)

En el proyecto BIB, crear épicas:

**Click en "Create" (+) → Seleccionar "Epic"**

**Epic 1:**
- **Summary:** Autenticación y Seguridad
- **Description:** Sistema de autenticación para administradores
- **Priority:** High
- **Labels:** backend, auth
- **Status:** Done

**Epic 2:**
- **Summary:** Gestión de Libros
- **Description:** CRUD completo de libros y catálogo
- **Priority:** High
- **Labels:** crud, backend, frontend
- **Status:** Done

**Epic 3:**
- **Summary:** Gestión de Usuarios
- **Description:** CRUD de usuarios y gestión de roles
- **Priority:** High
- **Labels:** crud, users
- **Status:** Done

**Epic 4:**
- **Summary:** Sistema de Préstamos
- **Description:** Gestión de préstamos, devoluciones y multas
- **Priority:** High
- **Labels:** loans, business-logic
- **Status:** Done

---

### 3️⃣ Crear las 18 Historias de Usuario (20 minutos)

**Click en "Create" (+) → Seleccionar "Story"**

Para cada historia, copiar y pegar la información de las tablas a continuación:

#### 📌 Epic 1: Autenticación y Seguridad

**Historia 1: Login de Administrador**
- **Summary:** Login de Administrador
- **Parent:** BIB-1 Autenticación y Seguridad
- **Description:** Como admin quiero iniciar sesión con email y contraseña para acceder al sistema
- **Priority:** High
- **Labels:** frontend, auth
- **Status:** Done
- **Story Points:** 5

**Historia 2: Protección de Rutas**
- **Summary:** Protección de Rutas
- **Parent:** BIB-1 Autenticación y Seguridad
- **Description:** Como sistema quiero validar que solo usuarios autenticados accedan al dashboard
- **Priority:** High
- **Labels:** frontend, security
- **Status:** Done
- **Story Points:** 3

#### 📌 Epic 2: Gestión de Libros

**Historia 3: Listar Libros**
- **Summary:** Listar Libros
- **Parent:** BIB-4 Gestión de Libros
- **Description:** Como admin quiero ver un listado de todos los libros para conocer el inventario
- **Priority:** High
- **Labels:** frontend, crud
- **Status:** Done
- **Story Points:** 3

**Historia 4: Agregar Libro**
- **Summary:** Agregar Libro
- **Parent:** BIB-4 Gestión de Libros
- **Description:** Como admin quiero agregar un nuevo libro al catálogo
- **Priority:** High
- **Labels:** frontend, backend, crud
- **Status:** Done
- **Story Points:** 5

**Historia 5: Editar Libro**
- **Summary:** Editar Libro
- **Parent:** BIB-4 Gestión de Libros
- **Description:** Como admin quiero modificar la información de un libro
- **Priority:** Medium
- **Labels:** frontend, crud
- **Status:** Done
- **Story Points:** 3

**Historia 6: Eliminar Libro**
- **Summary:** Eliminar Libro
- **Parent:** BIB-4 Gestión de Libros
- **Description:** Como admin quiero eliminar un libro del catálogo
- **Priority:** Medium
- **Labels:** frontend, backend, crud
- **Status:** Done
- **Story Points:** 3

**Historia 7: Buscar y Filtrar Libros**
- **Summary:** Buscar y Filtrar Libros
- **Parent:** BIB-4 Gestión de Libros
- **Description:** Como admin quiero buscar libros por título, autor o ISBN
- **Priority:** Medium
- **Labels:** frontend
- **Status:** Done
- **Story Points:** 2

#### 📌 Epic 3: Gestión de Usuarios

**Historia 8: Listar Usuarios**
- **Summary:** Listar Usuarios
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero ver todos los usuarios registrados
- **Priority:** High
- **Labels:** frontend, crud
- **Status:** Done
- **Story Points:** 3

**Historia 9: Registrar Usuario**
- **Summary:** Registrar Usuario
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero registrar un nuevo usuario
- **Priority:** High
- **Labels:** frontend, backend, crud
- **Status:** Done
- **Story Points:** 5

**Historia 10: Editar Usuario**
- **Summary:** Editar Usuario
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero modificar datos de un usuario
- **Priority:** Medium
- **Labels:** frontend, crud
- **Status:** Done
- **Story Points:** 3

**Historia 11: Eliminar Usuario**
- **Summary:** Eliminar Usuario
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero eliminar un usuario
- **Priority:** Medium
- **Labels:** frontend, backend
- **Status:** Done
- **Story Points:** 3

**Historia 12: Activar/Desactivar Usuario**
- **Summary:** Activar/Desactivar Usuario
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero activar o desactivar un usuario
- **Priority:** Medium
- **Labels:** frontend
- **Status:** Done
- **Story Points:** 2

**Historia 13: Buscar Usuarios**
- **Summary:** Buscar Usuarios
- **Parent:** BIB-10 Gestión de Usuarios
- **Description:** Como admin quiero buscar usuarios por nombre, email o teléfono
- **Priority:** Low
- **Labels:** frontend
- **Status:** Done
- **Story Points:** 2

#### 📌 Epic 4: Sistema de Préstamos

**Historia 14: Listar Préstamos**
- **Summary:** Listar Préstamos
- **Parent:** BIB-17 Sistema de Préstamos
- **Description:** Como admin quiero ver todos los préstamos
- **Priority:** High
- **Labels:** frontend
- **Status:** Done
- **Story Points:** 3

**Historia 15: Crear Préstamo**
- **Summary:** Crear Préstamo
- **Parent:** BIB-17 Sistema de Préstamos
- **Description:** Como admin quiero registrar un nuevo préstamo
- **Priority:** High
- **Labels:** frontend, backend, business-logic
- **Status:** Done
- **Story Points:** 8

**Historia 16: Procesar Devolución**
- **Summary:** Procesar Devolución
- **Parent:** BIB-17 Sistema de Préstamos
- **Description:** Como admin quiero registrar la devolución de un libro
- **Priority:** High
- **Labels:** frontend, backend, business-logic
- **Status:** Done
- **Story Points:** 5

**Historia 17: Búsqueda de Préstamos**
- **Summary:** Búsqueda de Préstamos
- **Parent:** BIB-17 Sistema de Préstamos
- **Description:** Como admin quiero buscar préstamos
- **Priority:** Medium
- **Labels:** frontend
- **Status:** Done
- **Story Points:** 2

**Historia 18: Dashboard con Estadísticas**
- **Summary:** Dashboard con Estadísticas
- **Parent:** BIB-1 Autenticación y Seguridad
- **Description:** Como admin quiero ver un resumen del sistema
- **Priority:** Medium
- **Labels:** frontend, dashboard
- **Status:** Done
- **Story Points:** 3

---

### 4️⃣ Crear Sprints y Asignar Historias (15 minutos)

#### Fechas de los Sprints (proyecto completado el 31 de octubre de 2025)

**Sprint 1 - Fundación:**
- **Inicio:** 16 de septiembre de 2025
- **Fin:** 29 de septiembre de 2025
- **Sprint Goal:** "Implementar autenticación y dashboard básico"

**Sprint 2 - Gestión de Libros:**
- **Inicio:** 30 de septiembre de 2025
- **Fin:** 13 de octubre de 2025
- **Sprint Goal:** "CRUD completo de libros y búsqueda"

**Sprint 3 - Gestión de Usuarios:**
- **Inicio:** 14 de octubre de 2025
- **Fin:** 27 de octubre de 2025
- **Sprint Goal:** "CRUD de usuarios y gestión de estados"

**Sprint 4 - Sistema de Préstamos:**
- **Inicio:** 28 de octubre de 2025
- **Fin:** 31 de octubre de 2025
- **Sprint Goal:** "Sistema completo de préstamos y devoluciones"

---

#### Pasos para crear cada Sprint:

1. **Ir al Backlog** del proyecto BIB

2. **Crear Sprint 1:**
   - Click en **"Create Sprint"**
   - Click en **"⋮" (tres puntos)** del sprint → **"Edit Sprint"**
   - Configurar:
     - **Name:** Sprint 1 - Fundación
     - **Start Date:** 16/09/2025
     - **End Date:** 29/09/2025
     - **Goal:** Implementar autenticación y dashboard básico
   - **Guardar**
   - **Arrastrar** estas historias al Sprint 1:
     - BIB-2: Login de Administrador
     - BIB-3: Protección de Rutas  
     - BIB-22: Dashboard con Estadísticas
   - Click **"Start Sprint"** → Confirmar
   - Inmediatamente click **"Complete Sprint"** → Mover todo a Done

3. **Crear Sprint 2:**
   - Click en **"Create Sprint"**
   - Click en **"⋮"** → **"Edit Sprint"**
   - Configurar:
     - **Name:** Sprint 2 - Gestión de Libros
     - **Start Date:** 30/09/2025
     - **End Date:** 13/10/2025
     - **Goal:** CRUD completo de libros y búsqueda
   - **Guardar**
   - **Arrastrar** estas historias al Sprint 2:
     - BIB-5: Listar Libros
     - BIB-6: Agregar Libro
     - BIB-7: Editar Libro
     - BIB-8: Eliminar Libro
     - BIB-9: Buscar y Filtrar Libros
   - Click **"Start Sprint"** → Confirmar
   - Click **"Complete Sprint"** → Mover todo a Done

4. **Crear Sprint 3:**
   - Click en **"Create Sprint"**
   - Click en **"⋮"** → **"Edit Sprint"**
   - Configurar:
     - **Name:** Sprint 3 - Gestión de Usuarios
     - **Start Date:** 14/10/2025
     - **End Date:** 27/10/2025
     - **Goal:** CRUD de usuarios y gestión de estados
   - **Guardar**
   - **Arrastrar** estas historias al Sprint 3:
     - BIB-10: Listar Usuarios
     - BIB-11: Registrar Usuario
     - BIB-12: Editar Usuario
     - BIB-13: Eliminar Usuario
     - BIB-14: Activar/Desactivar Usuario
     - BIB-15: Buscar Usuarios
   - Click **"Start Sprint"** → Confirmar
   - Click **"Complete Sprint"** → Mover todo a Done

5. **Crear Sprint 4:**
   - Click en **"Create Sprint"**
   - Click en **"⋮"** → **"Edit Sprint"**
   - Configurar:
     - **Name:** Sprint 4 - Sistema de Préstamos
     - **Start Date:** 28/10/2025
     - **End Date:** 31/10/2025 ✅ **(hace 3 días)**
     - **Goal:** Sistema completo de préstamos y devoluciones
   - **Guardar**
   - **Arrastrar** estas historias al Sprint 4:
     - BIB-18: Listar Préstamos
     - BIB-19: Crear Préstamo
     - BIB-20: Procesar Devolución
     - BIB-21: Búsqueda de Préstamos
   - Click **"Start Sprint"** → Confirmar
   - Click **"Complete Sprint"** → Mover todo a Done

---

**IMPORTANTE:** Al completar cada sprint, asegúrate de seleccionar **"Move issues to Done"** para que todas las historias queden marcadas como completadas.
