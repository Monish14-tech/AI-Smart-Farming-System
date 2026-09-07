-- 🌿 AgriNova — Complete Supabase PostgreSQL Initialization Script
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)

-- ── 1. Enable Required Extensions ──────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ── 2. Create Enums ────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('farmer', 'buyer', 'transporter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ListingStatus" AS ENUM ('active', 'sold', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'escrowed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "JobStatus" AS ENUM ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── 3. Create Tables ───────────────────────────────────────────

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" "Role" NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) UNIQUE NOT NULL,
    "phone" VARCHAR(15) UNIQUE NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_image" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Profiles
CREATE TABLE IF NOT EXISTS "farmer_profiles" (
    "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "farm_size_acres" DOUBLE PRECISION,
    "land_doc_url" TEXT,
    "upi_id" TEXT,
    "aadhaar_number" TEXT,
    "bank_account" TEXT,
    "ifsc_code" TEXT
);

-- Transporter Profiles
CREATE TABLE IF NOT EXISTS "transporter_profiles" (
    "user_id" UUID PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
    "vehicle_type" VARCHAR(50),
    "vehicle_capacity_kg" DOUBLE PRECISION,
    "vehicle_number" VARCHAR(20),
    "license_number" VARCHAR(50),
    "license_doc_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "current_latitude" DOUBLE PRECISION,
    "current_longitude" DOUBLE PRECISION
);

-- Crop Listings
CREATE TABLE IF NOT EXISTS "crop_listings" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "farmer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "crop_name" VARCHAR(100) NOT NULL,
    "quality_grade" VARCHAR(10),
    "quantity_kg" DOUBLE PRECISION NOT NULL,
    "price_per_kg" DOUBLE PRECISION NOT NULL,
    "harvest_date" DATE,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "embedding_str" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "buyer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "listing_id" UUID NOT NULL REFERENCES "crop_listings"("id") ON DELETE RESTRICT,
    "quantity_kg" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "payment_id" TEXT,
    "delivery_address" TEXT,
    "delivery_lat" DOUBLE PRECISION,
    "delivery_lng" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Transport Jobs
CREATE TABLE IF NOT EXISTS "transport_jobs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID UNIQUE NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "transporter_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
    "pickup_lat" DOUBLE PRECISION,
    "pickup_lng" DOUBLE PRECISION,
    "pickup_address" TEXT,
    "drop_lat" DOUBLE PRECISION,
    "drop_lng" DOUBLE PRECISION,
    "drop_address" TEXT,
    "optimized_route" JSONB,
    "estimated_km" DOUBLE PRECISION,
    "earning_amount" DOUBLE PRECISION,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "otp_code" VARCHAR(6),
    "proof_image_url" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "reviewer_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "reviewee_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chat Logs
CREATE TABLE IF NOT EXISTS "chat_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "context_type" VARCHAR(30) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. Indexes for Fast Queries ─────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_crop_listings_farmer" ON "crop_listings"("farmer_id");
CREATE INDEX IF NOT EXISTS "idx_crop_listings_status" ON "crop_listings"("status");
CREATE INDEX IF NOT EXISTS "idx_crop_listings_crop_name" ON "crop_listings"("crop_name");
CREATE INDEX IF NOT EXISTS "idx_orders_buyer" ON "orders"("buyer_id");
CREATE INDEX IF NOT EXISTS "idx_orders_listing" ON "orders"("listing_id");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "idx_transport_jobs_transporter" ON "transport_jobs"("transporter_id");
CREATE INDEX IF NOT EXISTS "idx_transport_jobs_status" ON "transport_jobs"("status");
CREATE INDEX IF NOT EXISTS "idx_chat_logs_user" ON "chat_logs"("user_id");

-- ── 5. PostGIS Helper: Find listings within radius (in KM) ─────
CREATE OR REPLACE FUNCTION get_nearby_listings(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
    id UUID,
    crop_name VARCHAR,
    price_per_kg DOUBLE PRECISION,
    quantity_kg DOUBLE PRECISION,
    farmer_name VARCHAR,
    distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        cl.id,
        cl.crop_name,
        cl.price_per_kg,
        cl.quantity_kg,
        u.name AS farmer_name,
        ROUND((ST_Distance(
            ST_SetSRID(ST_MakePoint(cl.longitude, cl.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000.0)::numeric, 2)::DOUBLE PRECISION AS distance_km
    FROM crop_listings cl
    JOIN users u ON cl.farmer_id = u.id
    WHERE cl.status = 'active'
      AND cl.latitude IS NOT NULL
      AND cl.longitude IS NOT NULL
      AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(cl.longitude, cl.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
          radius_km * 1000.0
      )
    ORDER BY distance_km ASC;
$$;
