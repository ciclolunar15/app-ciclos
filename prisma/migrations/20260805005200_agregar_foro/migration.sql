-- CreateTable
CREATE TABLE "PostForo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "esAnonimo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostForo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostForo_createdAt_idx" ON "PostForo"("createdAt");

-- AddForeignKey
ALTER TABLE "PostForo" ADD CONSTRAINT "PostForo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
