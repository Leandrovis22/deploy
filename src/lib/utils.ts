import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { config } from 'dotenv';
config();

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function verifyToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Token no proporcionado' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded; // Retorna el payload del token
  } catch (err) {
    return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
  }
}
