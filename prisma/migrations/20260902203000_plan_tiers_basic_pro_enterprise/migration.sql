-- Rename the two development-era plans without losing existing subscription data.
ALTER TYPE "PlanType" RENAME VALUE 'PREMIUM' TO 'BASIC';
ALTER TYPE "PlanType" RENAME VALUE 'PREMIUM_PLUS' TO 'PRO';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'ENTERPRISE';
