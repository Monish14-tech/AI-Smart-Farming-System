# AgriNova - Agricultural Marketplace and Logistics Platform

AgriNova is a digital trading platform connecting farmers, commercial wholesale buyers, and regional freight transporters across India. It provides direct lot sales, official mandi price benchmarking, escrow payment releases, and algorithmic multi-stop route dispatch.

## Core Features

- Farmer Portal: Produce listing management with quality grades (A/B/C), order acceptance, and official Agmarknet mandi modal price integration.
- Buyer Marketplace: Direct catalog sourcing with grade and location filters, transparent price discovery, and escrow-backed checkout.
- Transporter Portal: Regional consignment job board, multi-stop pickup-drop routing using nearest-neighbor vehicle routing heuristics (VRP), and OTP delivery verification.
- Administration: User verification, listing moderation, and transaction pipeline monitoring.
- Legal Compliance: Privacy Policy adhering to the Digital Personal Data Protection (DPDP) Act 2023 and commercial Terms of Service.

## Architecture

- Frontend: Next.js 16 (App Router), TypeScript, Vanilla CSS design system, Lucide icons, Leaflet / OpenStreetMap.
- Backend: Node.js, Express, TypeScript, Socket.io for telematics, Prisma ORM.
- Database: PostgreSQL with relational schema for users, produce listings, orders, and freight jobs.
- Logistics Engine: Nearest-neighbor VRP heuristic with geodesic distance computation.

## Project Structure

```
AgriNova/
├── frontend/             # Next.js web application
│   ├── src/app/          # App router pages (farmer, buyer, transporter, admin)
│   ├── src/components/   # Shared UI components and navigation
│   └── public/           # Static assets, SVG icon, and CNAME
├── backend/              # Express API server
│   ├── src/controllers/  # Route handlers (auth, listings, orders, transport)
│   ├── src/lib/          # VRP routing engine and external adapters
│   └── prisma/           # Database schema and migrations
└── ml/                   # Synthetic price regression and freight training data
```

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database instance

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Access the frontend application at http://localhost:3000.

## Custom Domain Setup

To point a custom domain (e.g., agrinova.market) to the platform:

1. DNS Configuration:
   - Apex domain (@): Add an A record pointing to your hosting provider IP address.
   - Subdomain (www): Add a CNAME record pointing to your deployment target.
2. Environment Variable:
   - Configure NEXT_PUBLIC_APP_URL in frontend environment settings:
     ```
     NEXT_PUBLIC_APP_URL=https://agrinova.market
     ```
3. Custom domain mapping is handled through frontend/public/CNAME for static hosting or host domain configuration in Vercel / Cloudflare.

## Production Build

```bash
# Frontend production bundle
cd frontend
npm run build

# Backend production build
cd backend
npm run build
npm start
```

## License

Proprietary. All rights reserved.
