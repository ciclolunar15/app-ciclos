-- CreateEnum
CREATE TYPE "FaseCicloConsejo" AS ENUM ('MENSTRUAL', 'PRE_OVULACION', 'OVULACION', 'PRE_MENSTRUAL');

-- CreateEnum
CREATE TYPE "FaseLunarConsejo" AS ENUM ('NUEVA', 'CRECIENTE', 'LLENA', 'MENGUANTE');

-- CreateTable
CREATE TABLE "Consejo" (
    "id" TEXT NOT NULL,
    "faseCiclo" "FaseCicloConsejo" NOT NULL,
    "faseLunar" "FaseLunarConsejo" NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consejo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consejo_faseCiclo_faseLunar_idx" ON "Consejo"("faseCiclo", "faseLunar");
