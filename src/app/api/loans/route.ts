import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyToken } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const loans = await prisma.loan.findMany();
    return NextResponse.json(loans);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener préstamos' }, { status: 500 });
  }
}

// Crear un nuevo préstamo
export async function POST(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { bookId, userId, loanDate, dueDate, status, returnDate } = body;
    if (!bookId || !userId || !loanDate || !dueDate || !status) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Verificar que el libro existe y tiene copias disponibles
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 });
    }
    // Contar préstamos activos de ese libro
    const activeLoans = await prisma.loan.count({
      where: { bookId, status: 'active' }
    });
    if (book.totalCopies - activeLoans <= 0) {
      return NextResponse.json({ error: 'No hay copias disponibles' }, { status: 400 });
    }

    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Usuario no válido o inactivo' }, { status: 400 });
    }

    // Verificar que el usuario no tenga ya un préstamo activo de ese libro
    const existingLoan = await prisma.loan.findFirst({
      where: { userId, bookId, status: 'active' }
    });
    if (existingLoan) {
      return NextResponse.json({ error: 'El usuario ya tiene este libro en préstamo activo' }, { status: 400 });
    }

    // Crear el préstamo
    const newLoan = await prisma.loan.create({
      data: {
        bookId,
        userId,
        loanDate: new Date(loanDate),
        dueDate: new Date(dueDate),
        returnDate: returnDate ? new Date(returnDate) : null,
        status,
      },
    });
    return NextResponse.json(newLoan, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear préstamo' }, { status: 500 });
  }
}
