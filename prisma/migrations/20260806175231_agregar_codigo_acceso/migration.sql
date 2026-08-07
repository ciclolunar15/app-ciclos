-- CreateTable
CREATE TABLE "CodigoAcceso" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "creadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usadoPorId" TEXT,
    "usadoEn" TIMESTAMP(3),

    CONSTRAINT "CodigoAcceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodigoAcceso_codigo_key" ON "CodigoAcceso"("codigo");

-- AddForeignKey
ALTER TABLE "CodigoAcceso" ADD CONSTRAINT "CodigoAcceso_usadoPorId_fkey" FOREIGN KEY ("usadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
