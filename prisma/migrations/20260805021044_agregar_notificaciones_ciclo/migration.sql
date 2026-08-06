-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificacionFaseCiclo" TEXT,
ADD COLUMN     "notificacionPeriodoHoy" DATE,
ADD COLUMN     "notificacionPeriodoProximo" DATE;
