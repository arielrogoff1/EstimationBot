# Spray Foam Estimator AI

AI-powered spray foam insulation estimation from building plans. Upload PDFs, blueprints, or floor plan images — Claude AI extracts dimensions and calculates board feet, R-values, and costs in under 2 minutes.

## Quick Start

```powershell
# 1. Run setup (removes routing conflict, creates .env.local)
.\setup.ps1

# 2. Fill in your API keys
notepad .env.local

# 3. Install dependencies
npm install

# 4. Push database schema
npx prisma db push

# 5. Seed default settings (foam costs, R-values, etc.)
npx prisma db seed

# 6. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Required API Keys

| Service | Purpose | Cost |
|---------|---------|------|
| [Clerk](https://clerk.com) | Authentication | Free |
| [Anthropic](https://console.anthropic.com) | Claude vision AI | Pay-per-use |
| [AWS S3](https://aws.amazon.com/s3) | File storage | ~$0.02/GB |
| PostgreSQL | Database | Free (Neon) |

## Features

- **AI Plan Analysis** — Claude reads scales, dimension strings, and wall types from any architectural PDF or image
- **Automatic Calculations** — Net wall area, board feet, required foam thickness, R-value compliance
- **Confidence Scoring** — Every measurement scored 0–100%; items below 85% flagged for review
- **Interactive Editor** — Click any measurement to edit length, height, foam type, R-value
- **Multi-Floor Support** — Basement, First Floor, Second Floor, Attic totals
- **Admin Panel** — Configure foam costs, labor rates, overhead/profit %, waste factors
- **Proposal Generator** — Print-ready customer proposals with full material breakdown

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Next.js API Routes
- **AI**: Anthropic Claude claude-sonnet-4-6 (vision + tool use)
- **Database**: PostgreSQL + Prisma
- **Storage**: AWS S3
- **Auth**: Clerk

## Workflow

1. Create project → enter address + builder
2. Upload PDFs / images (drag & drop)
3. Click "Analyze with AI" → Claude extracts all dimensions
4. Review measurements table → edit any low-confidence items
5. View totals sidebar → board feet, sets needed, estimated cost
6. Generate proposal → print or export

## Spray Foam Formulas

```
Net Wall Area = (Length × Height) - Window Area - Door Area
Required Thickness = Desired R-Value ÷ R-per-inch
Board Feet = Net Area × Required Thickness
Board Feet w/ Waste = Board Feet × (1 + waste% + yield_loss%)
Sell Price = (Material + Labor + Overhead) × (1 + profit%)
```

Default values (configurable in admin):
- Closed Cell: R-6.5/inch, $1.00/BF
- Open Cell: R-3.7/inch, $0.44/BF
- Waste factor: 10%
- Labor: $85/hour
- Overhead: 15%, Profit: 20%
