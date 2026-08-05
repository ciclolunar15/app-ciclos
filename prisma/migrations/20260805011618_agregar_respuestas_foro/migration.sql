-- AlterTable
ALTER TABLE "PostForo" ADD COLUMN     "respuestaAId" TEXT;

-- CreateIndex
CREATE INDEX "PostForo_respuestaAId_idx" ON "PostForo"("respuestaAId");

-- AddForeignKey
ALTER TABLE "PostForo" ADD CONSTRAINT "PostForo_respuestaAId_fkey" FOREIGN KEY ("respuestaAId") REFERENCES "PostForo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
