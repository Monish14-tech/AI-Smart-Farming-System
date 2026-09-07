# 🌿 AgriNova — Smart Agricultural Marketplace & Logistics Platform

> **A Role-Based Agricultural Platform Connecting Farmers, Buyers, and Transporters through AI-Assisted Marketplace, Route Optimization, and Conversational AI.**

---

## 🌟 Overview

AgriNova bridges the gap between Indian farmers, wholesale/retail buyers, and regional transporters. By eliminating middlemen and combining Gemini 1.5 Flash AI advisory with algorithmic Vehicle Routing Problem (VRP) logistics, AgriNova maximizes farmer revenue and ensures on-time, transparent produce delivery.

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts, Framer Motion, Lucide Icons, React Hot Toast |
| **Backend** | Node.js, Express, TypeScript, Socket.io (Real-time GPS), Prisma ORM |
| **Database** | Supabase PostgreSQL (`postgis` + `pgvector` extensions enabled) |
| **AI / ML** | Google Gemini 1.5 Flash (Advisory & Marketplace RAG, Trip Summaries), `text-embedding-004` (768-dim vector embeddings) |
| **Logistics** | Custom Nearest-Neighbor Vehicle Routing Problem (VRP) Solver ($O(n^2)$) + Mapbox GL |
| **External APIs** | Agmarknet / data.gov.in (Live Mandi Prices), Open-Meteo (Live Weather), Cloudinary (Image storage), Razorpay (Escrow payments) |

---

## 🚀 Key Features

### 🌾 1. Farmer Portal
- **Interactive Dashboard**: Live stats, today's mandi prices (live from data.gov.in), real-time weather widget, earnings summary.
- **Crop Listings Management**: Grade selection (A/B/C), multi-image upload via Cloudinary, live price/revenue estimator.
- **Order Management**: Accept/reject incoming orders with instant status synchronization.
- **Earnings Analytics**: Visual monthly bar charts and complete transaction history.
- **🌿 AgriBot (Gemini AI Advisory)**: Crop disease diagnosis, pest control recommendations, weather-adaptive farming tips, and government scheme advisories with voice input support (Web Speech API).

### 🛒 2. Buyer Marketplace
- **Direct Crop Marketplace**: Search by crop name, farmer, price filters, and quality grades.
- **Escrow-Protected Checkout**: Place orders where payment is held in escrow until OTP delivery confirmation.
- **Order Tracking**: Visual 4-step progress tracker with transporter contact and live delivery status.
- **🛒 ShopBot (Gemini AI Shopping Assistant)**: Natural language search ("500kg Grade A tomatoes under ₹25/kg near Pune").

### 🚛 3. Transporter Portal
- **Job Board**: Multi-pickup and multi-drop delivery jobs with upfront transparent earnings.
- **🧭 VRP Route Optimizer**: Calculates the shortest multi-stop pickup-drop route using a Greedy Nearest Neighbor heuristic, saving distance and fuel.
- **Trip Summaries**: Gemini AI-generated turn-by-turn routing narrative.
- **OTP Delivery Verification**: Two-sided verification releases escrow funds to the farmer immediately upon dropoff.
- **Live GPS Tracking**: Real-time geolocation broadcasted via Socket.io.

### 📊 4. Admin Panel & Intelligence
- **Platform Analytics**: Interactive Recharts visualization for user distribution by role, order pipeline status, and top crops by trade volume.
- **KYC Verification Queue**: Farmer land document and transporter vehicle verification with 1-click approvals.
- **Listing Moderation**: Content review and moderation queue.

---

## 📁 Repository Structure

```
AgriNova/
├── backend/                  # Node.js + Express + TypeScript Backend
│   ├── prisma/
│   │   └── schema.prisma     # 8 tables with PostGIS & pgvector
│   ├── src/
│   │   ├── db/
│   │   │   └── seed.ts       # Comprehensive seed data script
│   │   ├── lib/
│   │   │   ├── gemini.ts     # Gemini 1.5 Flash AI client & prompts
│   │   │   ├── prisma.ts     # Prisma singleton client
│   │   │   └── vrp.ts        # Vehicle Routing Problem greedy solver
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT authentication + RBAC guard
│   │   ├── routes/
│   │   │   ├── auth.ts       # Register, Login, Token Refresh
│   │   │   ├── farmer.ts     # Farmer listings, orders, earnings, mandi prices
│   │   │   ├── buyer.ts      # Marketplace, orders, reviews, Razorpay
│   │   │   ├── transporter.ts# Job board, VRP optimization, OTP delivery, GPS
│   │   │   ├── admin.ts      # Analytics, KYC queue, moderation
│   │   │   └── ai.ts         # Advisory chat, shop assistant, weather
│   │   └── index.ts          # Express server + Socket.io entry
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # Next.js 16 + React 19 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout with AuthProvider & Toaster
│   │   │   ├── globals.css   # Custom forest agri design system
│   │   │   ├── page.tsx      # Premium animated landing page
│   │   │   ├── auth/         # Login & 3-step Register pages
│   │   │   ├── farmer/       # Dashboard, Listings, New, Orders, Earnings, Mandi, Chat
│   │   │   ├── buyer/        # Dashboard, Marketplace, Orders, Chat
│   │   │   ├── transporter/  # Dashboard, Jobs, Active Trip, Earnings
│   │   │   └── admin/        # Analytics, Users/KYC
│   │   ├── components/
│   │   │   └── Sidebar.tsx   # Role-aware navigation sidebar
│   │   └── contexts/
│   │       └── AuthContext.tsx # JWT auth context + axios interceptors
│   ├── package.json
│   └── next.config.ts
│
├── .env.example              # Environment variables template
└── package.json              # Monorepo workspace configuration
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js 18+ & npm
- A Supabase project (PostgreSQL)

### 2. Configure Environment Variables
Copy `.env.example` to `backend/.env` and update the database URL and API keys:

```bash
cp .env.example backend/.env
```

Key environment variables:
```env
# Supabase PostgreSQL connection
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# JWT Secret
JWT_SECRET="agrinova-jwt-super-secret-key-32-chars-min"
JWT_REFRESH_SECRET="agrinova-jwt-refresh-super-secret-key"

# Gemini API
GEMINI_API_KEY="AIzaSy..."

# Cloudinary (Optional, for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"

# Razorpay (Optional, for sandbox payments)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your-secret"
```

### 3. Database Migration & Seed
```bash
# Push schema to Supabase
cd backend
npx prisma db push

# Seed demo users, listings, orders, and jobs
npm run db:seed
```

### 4. Run Development Servers
From the project root:

```bash
# Start backend on port 5000
npm run dev:backend

# In a separate terminal, start frontend on port 3000
npm run dev:frontend
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Demo User Credentials

The seed script creates pre-configured accounts for all roles (all passwords are `password123` / `admin123`):

| Role | Email | Password | Description |
|---|---|---|---|
| 🌾 **Farmer** | `rajesh@agrinova.test` | `password123` | Nashik tomato farmer (5.5 acres) |
| 🌾 **Farmer** | `suresh@agrinova.test` | `password123` | Pune onion farmer (8.0 acres) |
| 🛒 **Buyer** | `procurement@freshmart.test` | `password123` | Wholesale buyer, Mumbai |
| 🛒 **Buyer** | `purchase@organicdelight.test` | `password123` | Retail organic store, Pune |
| 🚛 **Transporter** | `asif@agrinova.test` | `password123` | Tata Ace mini-truck operator (3,000kg) |
| 👨‍💼 **Admin** | `admin@agrinova.test` | `admin123` | Platform Administrator |

*Note: The login page includes 1-click demo login buttons for rapid testing.*

---

## 🛡️ Security Architecture
- **JWT with Sliding Refresh Tokens**: 15m short-lived access tokens + 7d rotating refresh tokens.
- **Role-Based Access Control (RBAC)**: Middleware strictly checks permissions across Farmer, Buyer, Transporter, and Admin routes.
- **Escrow Settlement**: Buyer funds are sequestered in an escrow state and only settled to the farmer when the transporter verifies the buyer's 6-digit delivery OTP.
