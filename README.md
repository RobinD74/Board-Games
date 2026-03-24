# 🎲 Board Games Collection

A premium web application to browse and filter a personal collection of board games. Built with a focus on aesthetics and automated data management.

## Features

- **Premium UI**: Dark mode experience with glassmorphism, smooth animations, and modern typography.
- **Smart Filtering**: Search by name and filter by difficulty or genre.
- **Automated ETL**: Daily synchronization from Google Sheets to Supabase via GitHub Actions.
- **Secure by Design**: Implemented Row Level Security (RLS) and strict Content Security Policy (CSP).

## Tech Stack

- **Frontend**: React 19, Vanilla CSS (Custom Design System)
- **Backend**: Supabase (PostgreSQL + Auth/RLS)
- **Automation**: Python 3.11, GitHub Actions, Google Sheets API
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js & npm
- Supabase account
- Google Service Account (for ETL)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/RobinD74/Board-Games.git
   cd Board-Games
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (`.env.local`):
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Data Pipeline (ETL)

The project includes a Python-based ETL pipeline (`etl_sheets_to_supabase.py`) that:
1. **Extracts** data from a Google Sheet.
2. **Transforms** and validates the data (cleaning, type casting, deduplication).
3. **Loads** it into Supabase using an upsert logic (based on game name and owner).

This runs automatically every day at 06:00 UTC via GitHub Actions.

## Security

- **CSP**: Strict headers configured in `vercel.json`.
- **RLS**: Database access restricted to read-only for anonymous users.
- **Audit**: Regular security checks performed on dependencies and code patterns.

---
