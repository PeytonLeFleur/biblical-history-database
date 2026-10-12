ALTER TYPE "public"."narrative_mode" ADD VALUE 'literary_history';--> statement-breakpoint
ALTER TABLE "proposed_fulfillments" ALTER COLUMN "confidence" DROP NOT NULL;