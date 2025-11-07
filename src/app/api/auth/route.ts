import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET as string | undefined;

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
  }
  // Solo permite login de admin
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }
  if (user.password !== password) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }
  // Generar token JWT
  if (!SECRET_KEY) {
    return NextResponse.json({ error: 'JWT_SECRET no está definido en las variables de entorno' }, { status: 500 });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

  // No devolver password
  const { password: _, ...userSafe } = user;
  return NextResponse.json({ user: userSafe, token });
}
