-- Add social media fields
ALTER TABLE "SiteSettings" ADD COLUMN "socialFacebook" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "socialTwitter" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "socialInstagram" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "socialDiscord" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "socialYoutube" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "socialFacebookVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "socialTwitterVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "socialInstagramVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "socialDiscordVisible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SiteSettings" ADD COLUMN "socialYoutubeVisible" BOOLEAN NOT NULL DEFAULT false;

-- Add contact information fields
ALTER TABLE "SiteSettings" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactPhone" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactWhatsapp" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "contactAddress" TEXT; 