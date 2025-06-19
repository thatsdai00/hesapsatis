-- Add isBestseller field to Product model
ALTER TABLE "Product" ADD COLUMN "isBestseller" BOOLEAN NOT NULL DEFAULT false; 