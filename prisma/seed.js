import { PrismaClient } from '../src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.loan.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Crear categorías
  const novela = await prisma.category.create({
    data: { name: 'Novela' }
  });
  const infantil = await prisma.category.create({
    data: { name: 'Infantil' }
  });
  const clasico = await prisma.category.create({
    data: { name: 'Clásico' }
  });
  const cuento = await prisma.category.create({
    data: { name: 'Cuento' }
  });

  // Usuarios
  await prisma.user.createMany({
    data: [
      { name: 'admin', email: 'admin@admin.com', phone: '000000000', address: 'admin', membershipDate: new Date(), isActive: true, role: 'admin', password: 'admin' },
      { name: 'Juan Pérez', email: 'juan@example.com', phone: '123456789', address: 'Calle 1', membershipDate: new Date(), isActive: true, role: 'cliente'},
      { name: 'Ana Gómez', email: 'ana@example.com', phone: '987654321', address: 'Calle 2', membershipDate: new Date(), isActive: true, role: 'cliente' },
      { name: 'Luis Torres', email: 'luis@example.com', phone: '555555555', address: 'Calle 3', membershipDate: new Date(), isActive: true, role: 'cliente' },
    ]
  });

  // Libros con referencias a categorías
  await prisma.book.createMany({
    data: [
      { title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', isbn: '9780307474728', categoryId: novela.id, publicationYear: 1967, totalCopies: 5, createdAt: new Date() },
      { title: 'El Principito', author: 'Antoine de Saint-Exupéry', isbn: '9780156013987', categoryId: infantil.id, publicationYear: 1943, totalCopies: 3, createdAt: new Date() },
      { title: 'Rayuela', author: 'Julio Cortázar', isbn: '9788437604947', categoryId: novela.id, publicationYear: 1963, totalCopies: 4, createdAt: new Date() },
      { title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes', isbn: '9788491050297', categoryId: clasico.id, publicationYear: 1605, totalCopies: 2, createdAt: new Date() },
      { title: 'Ficciones', author: 'Jorge Luis Borges', isbn: '9788426404187', categoryId: cuento.id, publicationYear: 1944, totalCopies: 6, createdAt: new Date() },
    ]
  });

  console.log('✅ Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });