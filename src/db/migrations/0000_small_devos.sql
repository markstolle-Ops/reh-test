CREATE TYPE "public"."agent_license_check_method" AS ENUM('arello', 'manual');--> statement-breakpoint
CREATE TYPE "public"."agent_request_status" AS ENUM('pending', 'accepted', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'pending', 'sold');--> statement-breakpoint
CREATE TYPE "public"."mls_syndication_status" AS ENUM('submitted', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'condo', 'townhouse', 'land_lot');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('offer_submitted', 'counter_pending', 'offer_accepted', 'attorney_review', 'inspection_period', 'financing_period', 'pending_closing', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller');--> statement-breakpoint
CREATE TABLE "agent_license_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"state" text NOT NULL,
	"method" "agent_license_check_method" NOT NULL,
	"arello_result" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"license_states" text[] DEFAULT '{}' NOT NULL,
	"license_number" text NOT NULL,
	"stripe_account_id" text,
	"stripe_onboarding_complete" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"available_for_dispatch" boolean DEFAULT false NOT NULL,
	"flat_fee_cents" integer DEFAULT 50000 NOT NULL,
	"bio" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"agent_id" text,
	"state" text NOT NULL,
	"status" "agent_request_status" DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "buyer_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"listing_id" text,
	"metadata" text NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disclosure_form_schemas" (
	"id" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"form_name" text NOT NULL,
	"version" text NOT NULL,
	"fields" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"attorney_reviewed_at" timestamp,
	"attorney_name" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disclosure_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"user_id" text NOT NULL,
	"state" text NOT NULL,
	"form_schema_id" text NOT NULL,
	"answers" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source" text NOT NULL,
	"state" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"r2_key" text NOT NULL,
	"r2_url" text NOT NULL,
	"width" integer,
	"height" integer,
	"size_bytes" integer,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"street_address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"property_type" "property_type" NOT NULL,
	"price" integer NOT NULL,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"sqft" integer,
	"lot_size_sqft" integer,
	"year_built" integer,
	"description" text,
	"description_status" text DEFAULT 'pending' NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"photo_order" text[] DEFAULT '{}' NOT NULL,
	"location" geometry(point),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "mls_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"mls_source" text NOT NULL,
	"raw_data" text NOT NULL,
	"street_address" text,
	"city" text,
	"state" text,
	"zip" text,
	"price" integer,
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"sqft" integer,
	"property_type" text,
	"status" text,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"photo_urls" text[] DEFAULT '{}',
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mls_syndications" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"status" "mls_syndication_status" DEFAULT 'submitted' NOT NULL,
	"broker_email" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "reso_boards" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_url" text NOT NULL,
	"api_token" text NOT NULL,
	"coverage_states" text[] DEFAULT '{}' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"sync_interval_minutes" integer DEFAULT 60 NOT NULL,
	"last_synced_at" timestamp,
	"last_sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"listing_id" text,
	"mls_listing_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"filters" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_alert_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "showing_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_user_id" text,
	"requested_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signature_envelopes" (
	"id" text PRIMARY KEY NOT NULL,
	"signwell_document_id" text NOT NULL,
	"listing_id" text,
	"disclosure_form_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"audit_trail" text,
	"document_pdf_r2_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction_deadlines" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"deadline_type" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"reminder_sent_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_events" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" text NOT NULL,
	"actor_user_id" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"listing_id" text NOT NULL,
	"buyer_user_id" text NOT NULL,
	"seller_user_id" text NOT NULL,
	"property_state" text NOT NULL,
	"current_status" "transaction_status" DEFAULT 'offer_submitted' NOT NULL,
	"offer_price_cents" integer NOT NULL,
	"counter_price_cents" integer,
	"closing_date" timestamp,
	"inspection_deadline" timestamp,
	"financing_contingency_deadline" timestamp,
	"closing_disclosure_deadline" timestamp,
	"xstate_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wire_instructions" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"bank_name" text NOT NULL,
	"routing_number" text NOT NULL,
	"account_number" text NOT NULL,
	"account_name" text NOT NULL,
	"reference_note" text,
	"set_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wire_instructions_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "agent_license_checks" ADD CONSTRAINT "agent_license_checks_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_requests" ADD CONSTRAINT "agent_requests_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_requests" ADD CONSTRAINT "agent_requests_agent_id_agent_profiles_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disclosure_forms" ADD CONSTRAINT "disclosure_forms_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mls_syndications" ADD CONSTRAINT "mls_syndications_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "showing_requests" ADD CONSTRAINT "showing_requests_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_deadlines" ADD CONSTRAINT "transaction_deadlines_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wire_instructions" ADD CONSTRAINT "wire_instructions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;