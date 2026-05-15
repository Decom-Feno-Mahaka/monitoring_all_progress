-- CreateEnum
CREATE TYPE "ProjectPriority" AS ENUM ('URGENT', 'HIGH', 'NORMAL', 'LOW');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "priority" "ProjectPriority" NOT NULL DEFAULT 'NORMAL';
