-- Add siteTitle field to SiteSettings table
ALTER TABLE "SiteSettings" ADD COLUMN "siteTitle" TEXT NOT NULL DEFAULT ''; 