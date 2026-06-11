CREATE TABLE IF NOT EXISTS "admin_activity_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "admin_id" integer NOT NULL REFERENCES "users"("id"),
    "action" text NOT NULL,
    "description" text NOT NULL,
    "entity_type" varchar(50) NOT NULL,
    "entity_id" integer,
    "created_at" timestamp DEFAULT now()
);
