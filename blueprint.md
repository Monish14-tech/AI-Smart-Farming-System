# AgriConnect â€” Smart Farmer Marketplace, Buyer & Transporter Platform
### Final Year Project Blueprint

---

## 1. Project Concept & Name

Working name: **AgriConnect** (rename as you like â€” "KisanLink", "FarmBridge", "AgriRoute" all work too).

**One-line pitch:** A role-based agricultural platform connecting farmers, buyers, and transporters through an AI-assisted marketplace with route optimization and conversational support â€” reducing middlemen dependency and improving price transparency and logistics efficiency.

This is a strong final-year project because it combines: full-stack engineering, database design, role-based systems, real-time logistics (a genuinely hard CS problem â€” route optimization), and applied AI (RAG-based chat + agentic navigation) â€” all mapped to a real industry problem (Indian agri-supply chains).

---

## 2. System Architecture (High Level)

```
                        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                        â”‚      Client Apps         â”‚
                        â”‚  React/Next.js (Web)     â”‚
                        â”‚  Flutter/React Native     â”‚
                        â”‚  (Farmer / Buyer /        â”‚
                        â”‚   Transporter / Admin)    â”‚
                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                     â”‚ HTTPS / WSS
                        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                        â”‚   API Gateway / BFF       â”‚
                        â”‚  (Node.js/Express or      â”‚
                        â”‚   Django REST / FastAPI)  â”‚
                        â””â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚       â”‚       â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â” â”Œâ”€â”€â”€â”€â–¼â”€â”€â”€â”€â” â”Œâ–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â”‚ Auth Service â”‚ â”‚ Core     â”‚ â”‚ AI Service    â”‚
              â”‚ (JWT + RBAC) â”‚ â”‚ Business â”‚ â”‚ (Chat, Navi-  â”‚
              â”‚              â”‚ â”‚ Logic    â”‚ â”‚ gation, Price â”‚
              â”‚              â”‚ â”‚ (orders, â”‚ â”‚ Prediction)   â”‚
              â”‚              â”‚ â”‚ listings)â”‚ â”‚               â”‚
              â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚              â”‚               â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”
              â”‚           PostgreSQL (primary DB)            â”‚
              â”‚           + Redis (cache, sessions, geo)     â”‚
              â”‚           + S3/Cloudinary (images, docs)     â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                     â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”
              â”‚ Message Queue â”‚  (order events, notifications, AI jobs)
              â”‚ (RabbitMQ /   â”‚
              â”‚  Redis Streams)â”‚
              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Recommended stack:**
- **Frontend:** Next.js (web) + Tailwind, or React + Vite. Mobile: Flutter (best for farmer-facing low-bandwidth UI) or React Native.
- **Backend:** Node.js + Express/NestJS (good for real-time features via Socket.io) â€” or Django REST Framework if you want batteries-included auth/admin.
- **Database:** PostgreSQL (relational integrity for orders/payments) + PostGIS extension (critical â€” gives you geospatial queries for "nearest transporter", route matching, delivery zones).
- **Cache/session/live location:** Redis.
- **File storage:** Cloudinary (free tier) or Firebase Storage for product images, KYC docs.
- **Real-time tracking:** Socket.io or Firebase Realtime Database for live transporter location pings.
- **Deployment:** Render / Railway / Fly.io (free tiers) for backend, Vercel/Netlify for frontend, Supabase or Neon for managed Postgres (free tier).

---

## 3. Role-Based Modules

### A. Farmer Portal
- Registration with KYC (Aadhaar/land doc upload â€” mock verification for a student project)
- Crop/produce listing (name, quantity, price/unit, harvest date, quality grade, photos)
- Real-time mandi (market) price reference before setting price
- Order management dashboard (incoming orders, accept/reject/counter-offer)
- Earnings & payout history
- AI crop advisory chat (pest/disease ID, weather-based sowing advice)
- Multilingual + voice input (critical for real farmer usability â€” great differentiator in your report)

### B. Buyer Portal
- Browse/search/filter produce by crop, location, price, quality grade
- Bulk order / bidding option (buyers can post requirements, farmers bid â€” B2B twist)
- Cart + checkout + escrow-style payment (funds released on delivery confirmation)
- Order tracking (live map, powered by transporter GPS)
- Ratings & reviews for farmers
- AI shopping assistant ("find me 500kg of grade-A tomatoes under â‚¹20/kg near Coimbatore")

### C. Transporter Portal
- Vehicle registration (type, capacity, license)
- Available job board (pickup â†’ drop requests matched by route/capacity)
- **AI navigation assistant**: optimized multi-stop route planning (pickup from multiple farmers â†’ drop to buyer/warehouse), live traffic-aware ETA
- Earnings dashboard, trip history
- Proof-of-delivery (photo/OTP confirmation)

### D. Admin Panel
- User verification/approval (KYC review)
- Dispute resolution
- Commission/fee configuration
- Analytics dashboard (volume by crop, region heatmaps, active users)
- Content moderation for listings

---

## 4. AI Components (the two you specifically asked about)

### AI Chat Assistant
Two use cases, don't merge them into one bot â€” build separate system prompts/personas:
1. **Farmer advisory bot** â€” crop care, pest ID (with image upload), weather-based advice, government scheme info.
2. **Buyer/marketplace bot** â€” natural language search over your product DB (RAG pattern: embed listings, retrieve relevant ones, let LLM summarize/recommend).

Architecture: LLM API (see APIs below) + a lightweight RAG layer â€” embed your PostgreSQL listings using pgvector (Postgres extension, free, avoids needing a separate vector DB) and do semantic search before passing context to the LLM.

### AI Navigation Assistant
This is really a **route optimization problem**, not literally "AI" in the LLM sense â€” and that's a *better* answer for a final-year CS project because you can show real algorithmic work:
- Use **OSRM (Open Source Routing Machine)** or **GraphHopper** (self-hosted, free) for actual road routing.
- Solve multi-pickup-multi-drop as a **Vehicle Routing Problem (VRP)** â€” use Google OR-Tools (free, open source) for optimization. This is a genuinely strong "AI/algorithms" component for your report (constraint optimization, not just an API call).
- Layer an LLM on top only for natural-language trip summaries ("Your optimized route saves 12km and 20 minutes â€” start with Farmer Raju's pickup at 8 AM").

This combination (OR-Tools for real optimization + LLM for natural language explanation) will look far more substantial to evaluators than "I called Google Maps API."

---

## 5. Database Design

Use **PostgreSQL** with **PostGIS** (geospatial) and **pgvector** (semantic search) extensions â€” both free and both give you strong "production-grade" talking points in your viva.

### Core schema (simplified â€” expand with your own detail)

```sql
-- Unified users table with role discriminator (cleaner than 3 separate tables)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('farmer','buyer','transporter','admin')),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image TEXT,
    location GEOGRAPHY(POINT, 4326),   -- PostGIS: enables "nearest X" queries
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Role-specific extension tables (1-to-1 with users, avoids a bloated users table)
CREATE TABLE farmer_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    farm_size_acres DECIMAL,
    land_doc_url TEXT,
    upi_id VARCHAR(100)
);

CREATE TABLE transporter_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50),
    vehicle_capacity_kg DECIMAL,
    license_number VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    current_location GEOGRAPHY(POINT, 4326)  -- live GPS ping, updated frequently
);

CREATE TABLE crop_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES users(id),
    crop_name VARCHAR(100) NOT NULL,
    quality_grade VARCHAR(10),
    quantity_kg DECIMAL NOT NULL,
    price_per_kg DECIMAL NOT NULL,
    harvest_date DATE,
    images TEXT[],
    embedding VECTOR(768),        -- pgvector: for AI semantic search
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id),
    listing_id UUID REFERENCES crop_listings(id),
    quantity_kg DECIMAL NOT NULL,
    total_price DECIMAL NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending/confirmed/in_transit/delivered/cancelled
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transport_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    transporter_id UUID REFERENCES users(id),
    pickup_location GEOGRAPHY(POINT, 4326),
    drop_location GEOGRAPHY(POINT, 4326),
    optimized_route JSONB,          -- store OR-Tools/OSRM route output
    status VARCHAR(20) DEFAULT 'assigned',
    otp_code VARCHAR(6),
    delivered_at TIMESTAMPTZ
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    reviewer_id UUID REFERENCES users(id),
    reviewee_id UUID REFERENCES users(id),
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20),        -- 'user' or 'assistant'
    message TEXT,
    context_type VARCHAR(30), -- 'advisory' | 'marketplace_search' | 'support'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes that matter for production
CREATE INDEX idx_users_location ON users USING GIST(location);
CREATE INDEX idx_transporter_location ON transporter_profiles USING GIST(current_location);
CREATE INDEX idx_listings_embedding ON crop_listings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_orders_status ON orders(status);
```

**Why this design is "production-ready" in your report:**
- Single `users` table with role discriminator + extension tables = clean RBAC without duplicating auth logic.
- `GEOGRAPHY` + GIST indexes = genuinely fast "find nearest transporter/buyer" queries (mention this explicitly in your viva â€” it's a strong point).
- `pgvector` for semantic search = your AI chat isn't just prompt-stuffing, it's proper retrieval-augmented generation.
- Separate `chat_logs` = auditable AI interactions, useful for eval/demo.
- UUIDs instead of serial IDs = avoids enumeration attacks, standard in production systems.

For auth: **JWT access + refresh tokens**, role claim embedded in token, middleware checks role per route (`requireRole('farmer')`). Add rate limiting (express-rate-limit) and input validation (Zod/Joi) â€” mention these in your report as "production hardening."

---

## 6. Free APIs You Can Actually Use

| Purpose | API | Free tier notes |
|---|---|---|
| **Maps & routing** | OpenStreetMap + **OSRM** (self-host) or **GraphHopper** | Fully free, self-hosted, no API key limits â€” best for a "production" claim |
| **Maps & routing (hosted)** | **Mapbox** | Free up to 50k map loads/month, generous directions API free tier |
| **Route optimization** | **Google OR-Tools** | Open source library, not an API â€” no limits at all |
| **Weather (for advisory bot)** | **Open-Meteo** | Completely free, no API key needed, unlimited for non-commercial use |
| **Weather (alt)** | OpenWeatherMap | Free tier: 1,000 calls/day |
| **Mandi/crop prices (India)** | **data.gov.in â€” Agmarknet API** | Free govt API, real Indian market prices â€” huge credibility boost for your project |
| **LLM for chat assistant** | **Google Gemini API** (free tier, generous limits) | Best free option currently; also works natively if you build in Antigravity since it's Gemini-native |
| **LLM (alt)** | Anthropic Claude API / OpenAI API | Both offer limited free/trial credits â€” good for comparison in your report |
| **Embeddings for RAG** | Gemini embedding API or **Hugging Face Inference API** (free tier) | Use for the pgvector semantic search |
| **SMS/OTP** | **Twilio** (free trial credits) or **Fast2SMS** (India-focused, cheap/free tier) | For delivery OTP confirmation |
| **Payments (sandbox)** | **Razorpay** or **Stripe** test mode | Free, fully functional test/sandbox environment â€” don't need real money for a student project |
| **Translation (multilingual UI)** | **LibreTranslate** (open source, self-hostable, free) or Google Translate free tier | Important for farmer accessibility |
| **Image storage** | **Cloudinary** free tier (25 credits/month) | Product photos, KYC docs |
| **Push notifications** | **Firebase Cloud Messaging** | Completely free |
| **Auth (optional shortcut)** | **Supabase Auth** or **Firebase Auth** | Free, saves you building JWT from scratch if time is tight |

---

## 7. Feature Ideas to Push This Beyond a Typical Student Project

Pick 3â€“5 of these as your "differentiators" â€” don't try to build all of them, but list them in your report as "future scope" even if unbuilt:

1. **Price prediction model** â€” small regression/time-series model (even a simple ARIMA or scikit-learn model) trained on Agmarknet historical data, predicting next-week crop prices. This is a genuinely good ML component for a CS report.
2. **Crop disease detection via image** â€” use a pretrained CNN (MobileNet fine-tuned, or a free Hugging Face plant-disease model) so farmers upload a leaf photo and get a diagnosis.
3. **Offline-first PWA** â€” farmers in low-connectivity areas can queue listings offline, sync later. Great engineering talking point.
4. **Voice input in regional languages** â€” Web Speech API (free, browser-native) or Whisper (open source, self-hosted) for farmers who can't type easily.
5. **Dynamic pricing/bidding system** â€” buyers post requirements, farmers competitively bid â€” turns it from a static marketplace into a mini auction system.
6. **Carbon footprint / distance-saved tracker** â€” show how much transport distance the route optimizer saved vs. naive routing. Nice sustainability angle for evaluators.
7. **Blockchain-based traceability (optional, only if you want to go deep)** â€” hash each supply-chain step (harvest â†’ transport â†’ delivery) for a "farm to table" traceability demo. High-effort, only add if you have time.
8. **Escrow-style payments** â€” buyer's payment held until delivery OTP confirms â€” reduces fraud risk, a real fintech pattern worth mentioning.
9. **Government scheme matcher** â€” chat assistant cross-references farmer's crop/state with public scheme databases (data.gov.in) and surfaces relevant subsidies.
10. **Admin analytics dashboard** â€” heatmap of demand by region/crop, useful for showing "business intelligence" skills.

---

## 8. Working in Antigravity â€” Setup & Agent Strategy

Antigravity (Google's agentic IDE, now on 2.0 as of I/O 2026) is a strong fit for this project because you have several *independent* modules (farmer portal, buyer portal, transporter portal, AI service, DB layer) that can be developed as **parallel agent workstreams** in the Manager view rather than one long linear chat.

**Which agent/model to use:**
- Antigravity 2.0 currently supports **Gemini 3.5 Flash**, **Claude Sonnet 4.6**, and **Claude Opus 4.6** as selectable models per agent.
- **Recommended split:**
  - **Claude Sonnet 4.6** â€” your default for actual code generation (backend APIs, database schema, React components). It's strong at following detailed specs and producing clean, working code across a full-stack task like this.
  - **Gemini 3.5 Flash** â€” good for fast, cheap iteration on simpler/independent subtasks (e.g., UI tweaks, boilerplate CRUD screens) where you want speed over depth, and for its huge context window if you paste in a lot of existing code at once.
  - **Claude Opus 4.6** â€” reserve for the hardest single piece: designing the route-optimization/VRP logic and the RAG pipeline, where reasoning quality matters more than speed.
- Use the **Manager view** to spin up 3 agents in parallel once your schema is locked: one on the farmer/buyer/transporter auth+CRUD backend, one on the frontend role-based dashboards, one on the AI service (chat + navigation). Review each agent's artifact/plan before letting it run, since they'll touch the same DB â€” lock your schema first so agents don't diverge.

**Example prompt to hand an agent in Antigravity** (adapt per module):

```
You are building the backend for "AgriConnect", a role-based agricultural
marketplace with three user types: farmer, buyer, transporter.

Stack: Node.js + Express + TypeScript, PostgreSQL with PostGIS + pgvector,
JWT auth with role-based middleware, Redis for caching.

Task: Implement the authentication and user module.
- Unified `users` table with a `role` discriminator (farmer/buyer/transporter/admin)
  plus separate 1:1 extension tables `farmer_profiles`, `transporter_profiles`.
- Signup/login endpoints issuing JWT access + refresh tokens, role embedded in
  the token payload.
- Middleware `requireRole(...roles)` that blocks access to role-specific routes.
- Input validation with Zod, rate limiting on auth routes, bcrypt password hashing.
- Include a migration file (using Prisma or Knex, your choice) creating the
  schema described above, with GIST indexes on the geography columns.
- Write this as production-grade code: proper error handling, no secrets in
  code (use .env), and a short README explaining how to run migrations.

Before writing code, propose your file structure and the exact Prisma/Knex
schema as a plan artifact, then wait for my confirmation before implementing.
```

Use the same pattern for the frontend agent (specify design system, routing, role-guarded pages) and the AI-service agent (specify RAG pipeline with pgvector, OR-Tools route optimization, and the LLM API you're using). Keeping each prompt scoped to one module â€” with an explicit "propose a plan first" instruction â€” is what keeps multi-agent work from producing conflicting code.

---

## 9. Suggested Report/Viva Talking Points

When you present this, emphasize:
- **Why PostGIS + pgvector in one database** instead of bolting on a separate vector DB (Pinecone) â€” simpler ops, fewer moving parts, still "production-grade."
- **Why VRP/OR-Tools instead of just calling Google Maps** â€” shows you understand the actual optimization problem, not just API integration.
- **RBAC design decision** â€” single users table vs. three separate tables, and why you chose one.
- **Escrow payment flow** â€” a real fintech pattern, shows security thinking.
- Have a **"future scope" slide** listing the features you didn't build (blockchain traceability, price prediction ML model, etc.) â€” evaluators like seeing you scoped deliberately rather than ran out of time.

---

*Good luck â€” this is genuinely a strong, demo-able final year project if you scope the MVP (auth + listings + orders + basic route assignment + one AI chat) first, then layer in 2-3 differentiators rather than trying to build everything above.*
