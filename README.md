# Spray Foam Estimator AI

Upload a building plan (PDF or image) → Claude AI extracts every surface → dashboard shows measurements, board feet, and estimated cost.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key
cp .env.example .env
# Edit .env and paste your ANTHROPIC_API_KEY

# 3. Run
npm start
```

Open http://localhost:3000

## How it works

1. Drop a PDF or image of your building plans into the upload zone
2. Claude claude-sonnet-4-6 reads the plan and extracts all wall/roof/floor dimensions
3. Dashboard shows a measurement table grouped by floor with board feet, R-values, and cost estimate

## Formulas

```
Net Area    = (Length × Height) - Windows - Doors
Thickness   = R-Value ÷ R-per-inch
Board Feet  = Net Area × Thickness
Sell Price  = (Material + Labor) × 1.35
```

Defaults: Closed Cell R-6.5/in @ $1.00/BF · Open Cell R-3.7/in @ $0.44/BF · Labor $85/hr

## Stack

- Node.js + Express
- Anthropic Claude claude-sonnet-4-6 (vision)
- Vanilla HTML/CSS/JS frontend — no build step

## API Key

Get one at https://console.anthropic.com
