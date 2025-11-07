# Sistema de Gestión Bibliotecaria

Proyecto Final - Programación II
Técnico Superior en Desarrollo de Software

**Integrantes:**
- Rubén Moyano
- Gonzalo Peralta  
- Leandro Viscolungo

**Fecha:** 7 de Noviembre de 2025

---

## Contexto del Problema

**El desafío de la biblioteca tradicional**

En una biblioteca con cientos de libros y decenas de socios activos, el personal enfrentaba problemas diarios:
- 📚 Pérdida de control sobre el inventario de libros
- 👥 Dificultad para gestionar datos de clientes  
- 📅 Préstamos y devoluciones registrados en papel
- 💰 Imposibilidad de rastrear multas por devoluciones tardías
- ⏰ Tiempo perdido buscando información manualmente

**La bibliotecaria necesitaba una solución digital integral**

---

## Objetivos del Proyecto

**Transformar la gestión bibliotecaria**

✅ Digitalizar el control completo del inventario de libros

✅ Automatizar el sistema de préstamos y devoluciones

✅ Gestionar usuarios y sus estados de cuenta

✅ Calcular y controlar multas automáticamente

✅ Obtener reportes simples

✅ Proporcionar acceso seguro y desde cualquier dispositivo

---

## Funcionalidades Principales

**Gestión de Libros**
- Alta, baja y modificación de libros
- Búsqueda avanzada por título, autor o ISBN
- Control de stock (copias totales vs disponibles)
- Organización por categorías
- Visualización de libros más prestados

**Gestión de Usuarios**
- Registro de clientes y administradores
- Edición de datos personales
- Control de usuarios activos/inactivos
- Gestión de usuario y login para administradores

---

## Funcionalidades Principales (cont.)

**Sistema de Préstamos y Devoluciones**
- Registro de préstamos con fecha límite automática
- Estados: Activo, Vencido, Devuelto
- Control de disponibilidad de libros
- Gestión de devoluciones

**Gestión de Multas**
- Cálculo automático por días de retraso
- Marcado de multas pagadas/pendientes
- Reporte de deudores
- Posibilidad de bloquear nuevos préstamos para usuarios con multas pendientes

---

## Arquitectura del Sistema

**Stack Tecnológico**

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + Radix UI
- Sonner (notificaciones toast)

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- JWT para autenticación

**Herramientas:**
- Git & GitHub
- Jira (gestión de proyecto)
- GitHub Copilot, ChatGPT y Claude

---

## Flujo de Autenticación

**Usuario inicia sesión**
↓
Usuario ingresa email y contraseña
↓
**Frontend envía credenciales a /api/auth**
↓
API verifica con base de datos usando Prisma
↓
Si es válido: genera JWT con datos de usuario
↓
**API responde con token JWT**
↓
Frontend guarda token en localStorage
↓
**Redirige al dashboard principal**
↓
Todas las peticiones incluyen token en headers
↓
APIs validan token antes de responder

---

## Flujo de Gestión de Préstamos

**Usuario Admin accede a "Préstamos"**
↓
Selecciona usuario y libro
↓
**Frontend valida disponibilidad**
↓
Envía POST a /api/loans con datos
↓
**API verifica:**
- ¿Usuario tiene multas pendientes?
- ¿Libro tiene copias disponibles?
- ¿Usuario es cliente (no admin)?
↓
Crea préstamo en BD (estado: active)
↓
Calcula dueDate (14 días después)
↓
Actualiza copias disponibles del libro
↓
**Responde con préstamo creado**
↓
Frontend actualiza tabla y muestra notificación

---

## Flujo de Devolución

**Admin busca préstamo activo**
↓
Click en "Marcar como devuelto"
↓
**Frontend envía PATCH a /api/loans/[id]**
↓
API verifica si está vencido
↓
Si vencido: calcula multa (días × $100)
↓
**Actualiza préstamo:**
- status → returned
- returnDate → hoy
- lateFeesPaid → false (si hay multa)
↓
Incrementa copias disponibles del libro
↓
**Responde con datos actualizados**
↓
Frontend muestra badge de multa pendiente si aplica

---

## Modelo de Base de Datos

**Principales entidades:**

**Book**
- id, title, author, isbn
- publicationYear, totalCopies
- categoryId (FK → Category)
- loans (relación 1:N)

**User**
- id, name, email, phone, address
- membershipDate, isActive
- role (admin/cliente)
- password (nullable)
- loans (relación 1:N)

**Loan**
- id, bookId (FK), userId (FK)
- loanDate, dueDate, returnDate
- status (active/returned/overdue)
- lateFeesPaid (boolean)

**Category**
- id, name
- books (relación 1:N)

---

## Diagrama ER Simplificado

```
┌─────────────┐         ┌──────────────┐
│   Category  │────1:N──│     Book     │
└─────────────┘         └──────────────┘
                              │
                              │ 1:N
                              ▼
                        ┌──────────────┐
                        │     Loan     │
                        └──────────────┘
                              ▲
                              │ N:1
                              │
                        ┌──────────────┐
                        │     User     │
                        └──────────────┘
```

**Relaciones:**
- Un libro pertenece a una categoría
- Un usuario puede tener múltiples préstamos
- Un libro puede estar en múltiples préstamos
- Cada préstamo conecta un usuario con un libro

---

## Panel de Control Jira

**Gestión ágil del proyecto**

Utilizamos Jira para organizar el desarrollo:

[aqui ira FOTO de grafico jira] 

---

## Demostración en Vivo

**Escanea el QR para acceder al sistema**

[Aquí iría un QR code generado que apunte a tu URL de deployment]

**Credenciales de prueba:**
- Email: admin@admin.com
- Password: admin

---

## Principales Desafíos y Soluciones

**1. Sistema de Autenticación y Roles**
- **Problema:** Inicialmente no existía diferenciación entre usuarios y administradores
- **Solución:** Implementamos enum `UserRole`, campo `password` nullable, y JWT con validación de roles
- **Impacto:** Agregamos endpoint `/api/auth`, hooks `useAuthRedirect`, header global con logout

**2. Eliminación de Usuarios con Préstamos Activos**
- **Problema:** Se podían eliminar usuarios que tenían libros prestados
- **Solución:** Cambiamos a eliminación lógica (`isActive: false`) con validación de préstamos activos
- **Aprendizaje:** Importancia de integridad referencial y reglas de negocio

**3. Sistema de Categorías Faltante**
- **Problema:** Los libros no tenían categorización, dificultando organización y reportes
- **Solución:** Creamos modelo `Category`, migración, relación FK en `Book`, y CRUD completo
- **Mejora:** Búsqueda automática, sugerencias y filtros por categoría en BookManagement

---

## Principales Desafíos y Soluciones (cont.)

**4. Validaciones de Préstamos Inconsistentes**
- **Problema:** Se permitían préstamos duplicados, a admins, y sin verificar disponibilidad
- **Solución:** Múltiples validaciones en POST `/api/loans`:
  - Usuario activo y rol cliente
  - Copias disponibles del libro
  - No hay préstamo activo del mismo libro al mismo usuario
- **Extra:** Autocompletado inteligente que solo muestra libros disponibles

**5. Feedback Visual y Estados de Carga**
- **Problema:** Usuarios no sabían si las operaciones estaban en proceso
- **Solución:** Implementamos spinners, botones deshabilitados durante operaciones, y notificaciones toast con Sonner
- **Resultado:** UX más clara y profesional

**6. Diseño Responsivo en Tablas Complejas**
- **Problema:** Tablas con muchas columnas se rompían en móviles
- **Solución:** 
  - `overflow-x-auto` en contenedores
  - Menú hamburguesa para navegación móvil
  - Clases CSS condicionales (`.hide-below-920`)
  - Evento `nav-select` para sincronización de menú

---

## Aprendizajes Clave

**Técnicos:**
- Integración full-stack con Next.js App Router
- Modelado de datos relacionales con Prisma
- Implementación de autenticación JWT
- Gestión de estado en aplicaciones React complejas

**Metodológicos:**
- Trabajo colaborativo con Git (branches, PRs, resolución de conflictos merge)
- Metodología ágil con Jira (sprints, tareas divididas)

---

## Mejoras Futuras

**Funcionalidades propuestas:**

🌐 **Catálogo público con imagenes de portadas**
- Vista pública de libros disponibles
- Preview de la portada de libros en catálogo
- Búsqueda sin autenticación
- Sistema de reservas online

🔔 **Sistema de notificaciones**
- Emails automáticos de recordatorio
- Alertas de vencimiento próximo
- Confirmaciones de préstamo (para multiples empleados)

---

## Conclusiones

**Sistema completo y funcional**

✅ Cumple todos los objetivos planteados

✅ Arquitectura escalable y mantenible

✅ Stack tecnológico moderno y demandado

✅ Experiencia de usuario aceptable

---

## Gracias por su atención

**Repositorio:** github.com/moyano18/bibloteca-tp-final

*Desarrollado con 💙 y ☕*
