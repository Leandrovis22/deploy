-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('cliente', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'cliente';
