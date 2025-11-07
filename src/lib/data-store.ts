import type { Book, User, Loan } from "./types"
import { PrismaClient, LoanStatus } from "../generated/prisma";

const prisma = new PrismaClient();


class DataStore {

  // Books management

  async getBooks(): Promise<Book[]> {
    const books = await prisma.book.findMany({ include: { loans: true } });
    return books.map((book) => {
      const activeLoans = book.loans.filter((loan) => loan.status === 'active').length;
      return {
        ...book,
        availableCopies: book.totalCopies - activeLoans,
      };
    });
  }


  // saveBooks ya no es necesario con Prisma


  async addBook(book: Omit<Book, "id" | "createdAt">): Promise<Book> {
    const created = await prisma.book.create({
      data: {
        ...book,
        createdAt: new Date(),
      },
    });
    return {
      ...created,
      availableCopies: created.totalCopies,
    };
  }


  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    const updated = await prisma.book.update({
      where: { id },
      data: updates,
    });
    // Recalcular availableCopies
    const loans = await prisma.loan.findMany({ where: { bookId: id, status: 'active' } });
    return {
      ...updated,
      availableCopies: updated.totalCopies - loans.length,
    };
  }


  async deleteBook(id: string): Promise<boolean> {
    await prisma.book.delete({ where: { id } });
    return true;
  }

  // Users management

  async getUsers(): Promise<User[]> {
  return prisma.user.findMany();
  }


  // saveUsers ya no es necesario con Prisma


  async addUser(user: Omit<User, "id" | "membershipDate">): Promise<User> {
    return prisma.user.create({
      data: {
        ...user,
        membershipDate: new Date(),
      },
    });
  }


  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return prisma.user.update({
      where: { id },
      data: updates,
    });
  }


  async deleteUser(id: string): Promise<boolean> {
  await prisma.user.delete({ where: { id } });
  return true;
  }

  // Loans management

  async getLoans(): Promise<Loan[]> {
  return prisma.loan.findMany();
  }


  // saveLoans ya no es necesario con Prisma


  async addLoan(loan: Omit<Loan, "id">): Promise<Loan> {
    // Verificar disponibilidad antes de crear el préstamo
    const book = await prisma.book.findUnique({ where: { id: loan.bookId, }, include: { loans: true } });
    if (!book) throw new Error('Libro no encontrado');
    const activeLoans = book.loans.filter(l => l.status === 'active').length;
    if (book.totalCopies - activeLoans <= 0) throw new Error('No hay copias disponibles');

    const newLoan = await prisma.loan.create({
      data: {
        ...loan,
        status: LoanStatus.active,
      },
    });
    return newLoan;
  }


  async returnLoan(loanId: string): Promise<Loan | null> {
    const loan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        returnDate: new Date(),
        status: LoanStatus.returned,
      },
    });
    // La disponibilidad se recalcula dinámicamente, no se modifica totalCopies
    return loan;
  }


  // initializeSampleData ya no es necesario con Prisma
}

export const dataStore = new DataStore()
