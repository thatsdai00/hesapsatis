-- Add footerInstitutionalTitle field to SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "footerInstitutionalTitle" TEXT NOT NULL DEFAULT 'Kurumsal';

-- Create HeaderLink table
CREATE TABLE "HeaderLink" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderLink_pkey" PRIMARY KEY ("id")
);

-- Create FooterLink table
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "section" TEXT NOT NULL DEFAULT 'institutional',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
); 