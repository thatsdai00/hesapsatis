-- Add SEO fields to SiteSettings table
ALTER TABLE "SiteSettings" ADD COLUMN "seoDescription" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "seoKeywords" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSettings" ADD COLUMN "ogImage" TEXT NOT NULL DEFAULT ''; 