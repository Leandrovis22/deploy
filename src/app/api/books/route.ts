import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyToken } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const books = await prisma.book.findMany({ 
      include: { 
        loans: true,
        category: true 
      } 
    });
    const booksWithAvailable = books.map(book => {
      const activeLoans = book.loans.filter(l => l.status === 'active').length;
      return {
        ...book,
        availableCopies: book.totalCopies - activeLoans,
      };
    });
    return NextResponse.json(booksWithAvailable);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener libros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, author, isbn, categoryId, publicationYear, totalCopies } = data;
    
    if (!title || !author || !isbn || !categoryId) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Verificar que la categoría existe
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        categoryId,
        publicationYear,
        totalCopies,
        createdAt: new Date(),
      },
      include: {
        category: true
      }
    });
    return NextResponse.json(newBook);
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear libro' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    
    // Si se actualiza la categoría, verificar que existe
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) {
        return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
      }
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });
    return NextResponse.json(updatedBook);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar libro' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    // Si el error es por restricción de clave foránea, mostrar mensaje amigable
    const message = (err as any)?.message || '';
    if (message.includes('Foreign key constraint') || message.includes('Loan_bookId_fkey')) {
      return NextResponse.json({ error: 'No se puede eliminar el libro porque tiene préstamos activos.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar libro' }, { status: 500 });
  }
}
