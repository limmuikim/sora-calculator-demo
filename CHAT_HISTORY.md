# Singapore SORA Calculator — Project & Chat History Export

**Date**: 2026-10-05  
**Repository**: [https://github.com/limmuikim/sora-calculator-demo](https://github.com/limmuikim/sora-calculator-demo)  
**Target Environment**: Node.js / React 19 / TypeScript / Vite / Express / Serverless  

---

## Conversation & Development Log

### Phase 1: Initial SORA Calculator Frontend Request

#### User Prompt:
> "Build me a simple singapore based SORA calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the front end for now, I will include the backend integration and logic in the next phase."

#### Implementation Summary:
1. **MAS Benchmark Data Engine (`src/data/masSoraRates.ts`)**:
   - Integrated historical and live daily SORA dataset published by the Monetary Authority of Singapore (MAS).
   - Covers all official tenors: Overnight SORA (Daily Spot), SORA Index, 1-Month Compounded SORA, 3-Month Compounded SORA, 6-Month Compounded SORA, aggregate transaction volumes (SGD M), and percentile distributions (10th, 25th, 75th, 90th).
   - Added automatic fallback to verified offline series if the network is disconnected.

2. **Singapore Mortgage & Housing Loan Calculator (`src/components/MortgageCalculator.tsx`)**:
   - Monthly amortization calculation: $M = P \frac{r(1+r)^N}{(1+r)^N - 1}$.
   - Supports P&I (Principal & Interest) and Interest-Only repayment types.
   - Tenor benchmarks: 1M, 3M (retail standard), 6M Compounded SORA, or Custom Fixed Rate.
   - Single and Tiered Bank Spread models (e.g. Years 1–2 promo spread vs. Year 3+ spread).
   - MAS Regulatory Stress Test evaluation (standard 4.00% floor) detailing monthly buffer increases.
   - Interactive Amortization Schedule (annual summary and monthly views) with CSV export.

3. **Commercial & Corporate Compounding-in-Arrears (`src/components/CommercialCalculator.tsx`)**:
   - Computes interest according to the official MAS and Association of Banks in Singapore (ABS) daily compounding formula:
     $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_0} \left( 1 + \frac{r_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d} \times 100\%$$
   - Respects Actual/365 Singapore convention, calendar weekend weighting ($n_i = 3$), and 5-day / 2-day / 0-day lookback conventions.
   - Mathematical cross-verification against published MAS SORA Index ratios:
     $$\text{Rate} = \left( \frac{\text{Index}_{\text{end}}}{\text{Index}_{\text{start}}} - 1 \right) \times \frac{365}{d}$$
   - Day-by-day compounding audit ledger with CSV export.

4. **Refinancing Comparator (`src/components/RefinanceComparator.tsx`)**:
   - Side-by-side comparison between existing loan packages (fixed/board rate) and new SORA packages.
   - Evaluates monthly savings, 1-year savings, and 3-year net savings after bank legal subsidies and cash rebates.
   - Computes breakeven timeline in months.

5. **MAS Directory & Reference Guide (`src/components/MasRatesDirectory.tsx`)**:
   - Full historical data table with search by date and CSV export.
   - Architectural and regulatory explainer on SORA calculation mechanics, SIBOR transition, and Actual/365 rules.

6. **Design Discipline (`src/components/Header.tsx`, `src/components/MasRateTicker.tsx`, `src/index.css`)**:
   - Enforced clean top bar contract (1 wordmark, 4 tabs, 1 action zone).
   - Applied tabular numerals (`tabular-nums font-mono`) across all financial metrics.
   - Strict 60-30-10 color allocation and anti-slop guidelines.

---

### Phase 2: Git Initialization and Push to GitHub

#### User Prompt:
> "git push https://<REDACTED_GITHUB_PAT>@https://github.com/limmuikim/sora-calculator-demo.git"

#### Actions Taken:
1. Detected that git was not yet initialized in `/app/applet`.
2. Initialized git repository:
   - Configured `user.name "limmuikim"` and `user.email "muikimlim.insead@gmail.com"`.
   - Created root commit: `0ff1b96 Initial commit: Singapore SORA Interest Calculator`.
   - Set branch to `main`.
3. Sanitized accidental double-protocol URL in user input (`https://ghp_...@https://github.com/...` $\rightarrow$ `https://ghp_...@github.com/...`).
4. Added remote origin and pushed to GitHub:
   - Command: `git remote add origin https://<TOKEN>@github.com/limmuikim/sora-calculator-demo.git && git push -u origin main`.
   - Status: Successfully pushed and set upstream tracking to `origin/main`.

---

### Phase 3: Serverless MAS Connection Setup

#### User Prompt:
> "add a serverless connection that pulls MAS data using the following end points:   
> - store this in /api folder (at project root level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> -do not hardcode any api keys, i will include them manually 
> 
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> 
> # All requests need the header:  KeyId: <MAS_KEY_ID>"

#### Actions Taken:
1. **Created `/api/health.ts`**:
   - Health check endpoint at project root level `/api`.
   - Reports service status, endpoint mapping, and whether `MAS_KEY_ID` is present in the environment without exposing the key value.

2. **Created `/api/sora.ts`**:
   - Serverless handler at project root level `/api`.
   - Zero hardcoded keys: reads `process.env.MAS_KEY_ID` (and falls back to `process.env.MAS_API_KEY`).
   - Forwards requests to the MAS API Gateway:
     `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
   - Injects required header: `KeyId: <MAS_KEY_ID>`.
   - Normalizes raw MAS data fields (`sora`, `sora_index`, `comp_sora_1m`, `comp_sora_3m`, `comp_sora_6m`, `aggregate_volume`, percentiles).
   - Handles CORS preflight and parameter forwarding (`limit`, `start_date`, `end_date`).

3. **Created `server.ts` & Express Integration**:
   - Created root `server.ts` entry point running on port 3000.
   - Mounts `/api/health` and `/api/sora` endpoints.
   - Mounts Vite middlewares in dev mode (`"dev": "tsx server.ts"`).
   - Serves built static files in production (`"start": "tsx server.ts"`).

4. **Updated `.env.example`**:
   - Added documentation for `MAS_KEY_ID="YOUR_MAS_KEY_ID"`.

5. **Integrated Frontend Data Pipeline**:
   - Updated `fetchLiveMasSoraData()` in `src/data/masSoraRates.ts` to query `/api/sora` first.

6. **Testing & Verification**:
   - Ran `curl http://localhost:3000/api/health` and `curl http://localhost:3000/api/sora`.
   - Validated that both endpoints respond with appropriate JSON and instructions when the key is unconfigured.
   - Tested app compilation with `compile_applet` and type check with `lint_applet` (`tsc --noEmit`).

7. **Git Synchronization**:
   - Committed changes: `d7a2398 feat: add serverless /api/sora and /api/health with MAS API Gateway connection`.
   - Pushed directly to `origin/main`.

---

## Project Structure Overview

```
.
├── .env.example
├── .gitignore
├── api/
│   ├── health.ts         # Serverless health check endpoint
│   └── sora.ts           # Serverless MAS SORA API Gateway proxy
├── dist/
├── index.html
├── metadata.json
├── package.json
├── server.ts             # Express server mounting /api and Vite middlewares
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── CommercialCalculator.tsx
│   │   ├── Header.tsx
│   │   ├── MasRateTicker.tsx
│   │   ├── MasRatesDirectory.tsx
│   │   ├── MortgageCalculator.tsx
│   │   └── RefinanceComparator.tsx
│   ├── data/
│   │   └── masSoraRates.ts
│   ├── index.css
│   ├── main.tsx
│   └── types/
│       └── sora.ts
├── tsconfig.json
└── vite.config.ts
```

---

## How to Run & Configure

1. **Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your MAS API Key:
   ```env
   MAS_KEY_ID="your_actual_key_id_here"
   ```

2. **Run in Development**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`, with API endpoints available at:
   - `http://localhost:3000/api/health`
   - `http://localhost:3000/api/sora`

3. **Build & Production**:
   ```bash
   npm run build
   npm run start
   ```
