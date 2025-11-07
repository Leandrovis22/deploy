import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyToken } from '@/lib/utils';

const prisma = new PrismaClient();

// Actualizar un préstamo (devolver libro, cambiar estado, etc)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status, returnDate, loanDate, dueDate, bookId, userId } = body;
    if (!status) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }
    // Verificar que el préstamo existe
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }
    // Actualizar el préstamo
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status,
        returnDate: returnDate ? new Date(returnDate) : null,
        loanDate: loanDate ? new Date(loanDate) : loan.loanDate,
        dueDate: dueDate ? new Date(dueDate) : loan.dueDate,
        bookId: bookId || loan.bookId,
        userId: userId || loan.userId,
      },
    });
    return NextResponse.json(updatedLoan);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar préstamo' }, { status: 500 });
  }
}

// Marcar multas como pagadas
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { lateFeesPaid } = body;
    
    if (typeof lateFeesPaid !== 'boolean') {
      return NextResponse.json({ error: 'Valor lateFeesPaid inválido' }, { status: 400 });
    }
    
    // Verificar que el préstamo existe
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }
    
    // Actualizar el estado de pago de multas
    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: { lateFeesPaid },
    });
    
    return NextResponse.json(updatedLoan);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar estado de multas' }, { status: 500 });
  }
}

// Eliminar un préstamo
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = params;
    
    // Verificar que el préstamo existe
    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }
    
    // Eliminar el préstamo
    await prisma.loan.delete({ where: { id } });
    
    return NextResponse.json({ message: 'Préstamo eliminado exitosamente' });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar préstamo' }, { status: 500 });
  }
}

// Obtener un préstamo por ID
export async function GET(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const loan = await prisma.loan.findUnique({ where: { id } });
    if (!loan) return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });

    return NextResponse.json(loan);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener préstamo' }, { status: 500 });
  }
}

