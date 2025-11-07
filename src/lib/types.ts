// Definiciones de Tipos para la Aplicación Bibliotecaria

/**
 * Interfaz para representar una Categoría de libros.
 */
export interface Category {
    id: string;
    name: string;
    _count?: {
        books: number;
    };
}

/**
 * Interfaz para representar un Libro en el inventario.
 */
export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    categoryId: string;
    category?: Category; // Populated cuando se incluye en la consulta
    publicationYear: number;
    totalCopies: number;
    // Esta propiedad se calcula dinámicamente en DataStore (totalCopies - préstamos activos)
    availableCopies?: number; 
    createdAt: Date;
}

/**
 * Interfaz para representar un Usuario (Miembro) de la biblioteca.
 */
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    membershipDate: Date; // Formato ISO Date string (e.g., "2023-10-26T10:00:00.000Z")
    isActive: boolean; // Indica si el usuario puede pedir libros prestados
    role: "admin" | "cliente";
}

/**
 * Interfaz para representar un Préstamo (Loan) activo o histórico.
 */
export interface Loan {
    id: string;
    bookId: string; // Referencia al ID del Libro
    userId: string; // Referencia al ID del Usuario
    loanDate: Date; // Fecha en que se prestó el libro
    dueDate: Date; // Fecha límite de devolución
    returnDate: Date | null; // Fecha de devolución real (null si está activo)
    status: 'active' | 'returned' | 'overdue'; // Estado actual del préstamo
    lateFeesPaid: boolean; // Indica si las multas por retraso han sido pagadas
}

//Interfaz extendida de Loan que incluye los detalles completos del libro y usuario.
//Útil para mostrar información detallada en tablas y vistas.

export interface LoanWithDetails extends Loan {
    book: Book;
    user: User;
}