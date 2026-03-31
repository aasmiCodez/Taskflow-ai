-- AlterTable
ALTER TABLE "User"
ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordResetTokenHash" TEXT,
ADD COLUMN "passwordSetupExpiresAt" TIMESTAMP(3),
ADD COLUMN "passwordSetupTokenHash" TEXT;
