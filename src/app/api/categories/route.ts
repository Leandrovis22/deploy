import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyToken } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { books: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name } = data;
    
    if (!name) {
      return NextResponse.json({ error: 'El nombre de la categoría es requerido' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: { name }
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (err) {
    const message = (err as any)?.message || '';
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verificar si la categoría tiene libros asociados
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { books: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
    }

    if (category._count.books > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la categoría porque tiene libros asociados' },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}
