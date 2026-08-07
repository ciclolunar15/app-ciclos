-- CreateTable
CREATE TABLE "ImagenSincronario" (
    "id" TEXT NOT NULL,
    "datos" BYTEA NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "subidaPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImagenSincronario_pkey" PRIMARY KEY ("id")
);
