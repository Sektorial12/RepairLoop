CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text,
	"action" text NOT NULL,
	"entity" text,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compatibility" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"part_id" text NOT NULL,
	"fitment_note" text NOT NULL,
	"source_id" text NOT NULL,
	"evidence_quote" text,
	"status" text DEFAULT 'verified' NOT NULL,
	"verified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "device_models" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"family" text NOT NULL,
	"model" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"regulatory_model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_case_id" uuid,
	"paypal_order_id" text,
	"paypal_capture_id" text,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_paypal_order_id_unique" UNIQUE("paypal_order_id")
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'battery' NOT NULL,
	"capacity_wh" integer NOT NULL,
	"voltage" numeric(4, 1) NOT NULL,
	"cells" integer NOT NULL,
	"part_number" text NOT NULL,
	"alt_part_numbers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seller" text NOT NULL,
	"price_demo" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'verified' NOT NULL,
	"source_id" text NOT NULL,
	"verified_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" uuid,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" text,
	"installed_part_number" text,
	"design_capacity_mwh" integer,
	"full_charge_capacity_mwh" integer,
	"health_pct" numeric(5, 2),
	"symptom_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_part_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"publisher" text NOT NULL,
	"url" text NOT NULL,
	"accessed_at" timestamp with time zone NOT NULL,
	"license_terms" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "symptom_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"symptom_tag" text NOT NULL,
	"part_category" text NOT NULL,
	"rationale" text NOT NULL,
	"source_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "symptoms" (
	"id" text PRIMARY KEY NOT NULL,
	"tag" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"safety_flag" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compatibility" ADD CONSTRAINT "compatibility_model_id_device_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."device_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility" ADD CONSTRAINT "compatibility_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compatibility" ADD CONSTRAINT "compatibility_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_repair_case_id_repair_cases_id_fk" FOREIGN KEY ("repair_case_id") REFERENCES "public"."repair_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cases" ADD CONSTRAINT "repair_cases_model_id_device_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."device_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_cases" ADD CONSTRAINT "repair_cases_selected_part_id_parts_id_fk" FOREIGN KEY ("selected_part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "symptom_rules" ADD CONSTRAINT "symptom_rules_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "compatibility_model_part_unique" ON "compatibility" USING btree ("model_id","part_id");--> statement-breakpoint
CREATE UNIQUE INDEX "parts_part_number_unique" ON "parts" USING btree ("part_number");--> statement-breakpoint
CREATE UNIQUE INDEX "symptoms_tag_unique" ON "symptoms" USING btree ("tag");