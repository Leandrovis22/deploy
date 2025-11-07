import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { verifyToken } from '@/lib/utils';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const auth = verifyToken(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await prisma.user.findMany();
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newUser = await prisma.user.create({
      data: {
        ...data,
        role: data.role || 'cliente',
        membershipDate: new Date(),
      },
    });
    return NextResponse.json(newUser);
  } catch (err) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const data = await request.json();
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });
    return NextResponse.json(updatedUser);
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // Verificar si el usuario tiene préstamos activos
    const activeLoans = await prisma.loan.count({
      where: { userId: id, status: 'active' }
    });
    if (activeLoans > 0) {
      return NextResponse.json({ error: 'No se puede eliminar el usuario porque tiene préstamos activos.' }, { status: 400 });
    }

    // Eliminar el usuario de la base de datos
    const deletedUser = await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ success: true, user: deletedUser });
  } catch (err) {
    const message = (err as any)?.message || '';
    if (message.includes('Foreign key constraint') || message.includes('Loan_userId_fkey')) {
      return NextResponse.json({ error: 'No se puede eliminar el usuario porque tiene préstamos activos.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al desactivar usuario' }, { status: 500 });
  }
}
