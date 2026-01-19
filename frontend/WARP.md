# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` for the Gemini AI security analysis feature.

## Architecture Overview

This is a React + TypeScript SPA built with Vite for launching Solana tokens on Pump.fun with bundled wallet management.

### Core Components

- **App.tsx** - Monolithic main component containing all application state and logic:
  - Token launch configuration (name, ticker, images, social links, authority settings)
  - Bundled wallet generation and management
  - Phantom wallet integration for Solana transactions
  - Volume bot controller for automated buy/sell execution
  - Stealth exit strategies (instant rug, slow rug, drain to main)

- **types.ts** - TypeScript interfaces: `BundleWallet`, `LaunchConfig`, `VolumeBotConfig`, `StealthExitConfig`, `AnalysisResult`, `SecurityCheck`

- **services/geminiService.ts** - Google Gemini API integration for AI-powered DeFi security audits using structured JSON output schema

- **components/** - Visualization components:
  - `BundleVisualizer.tsx` - Pie chart for wallet cluster analysis (uses recharts)
  - `SecurityCard.tsx` - Security check status display

### Technical Notes

- Tailwind CSS loaded via CDN in `index.html`
- ESM imports configured via importmap in `index.html` for browser module resolution
- Uses `@/*` path alias pointing to project root (configured in tsconfig.json and vite.config.ts)
- Wallet operations are currently simulated (console.log for Jito bundle creation)
- No test framework or linting tools configured
