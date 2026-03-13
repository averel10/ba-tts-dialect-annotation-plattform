# TTS Dialect Annotation Platform

A Next.js web application for annotating and managing dialect audio datasets.

## Prerequisites

- Node.js 18+
- npm or yarn
- SQLite (included with better-sqlite3)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the project root with necessary configuration (database URL, auth secrets, etc.).

### 3. Initialize Database
```bash
npm run db:generate  # Generate migration files
npm run db:push     # Apply migrations to database
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/` - Next.js pages and API routes
  - `admin/` - Admin dashboard pages
  - `user/` - User authentication pages
  - `actions/` - Server actions for data operations
- `src/components/` - Reusable React components
- `src/lib/` - Utilities, database, and auth configuration
- `drizzle/` - Database migrations
- `public/datasets/` - Dataset storage

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate database migrations |
| `npm run db:push` | Push migrations to database |

## Tech Stack

- **Framework**: Next.js 16
- **Auth**: Better-Auth
- **Database**: Drizzle ORM + SQLite
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Modifying the Data Model

### Steps to Update the Database Schema

1. **Edit the Schema**
   - Open `src/lib/model/` and modify the relevant schema files
   - Export any new tables in `src/lib/model/index.ts`

2. **Generate Migration**
   ```bash
   npm run db:generate
   ```
   This creates SQL migration files in the `drizzle/` directory.

3. **Review the Migration**
   - Check the generated SQL file in `drizzle/` to ensure correctness
   - Make manual adjustments if needed

4. **Update Server Actions** (if needed)
   - Update or create server actions in `src/app/actions/` to handle the new fields/tables

### Example: Adding a New Field

1. Open `src/lib/model/dataset_entry.ts`
2. Add the new column to the schema
3. Run `npm run db:generate`
4. Review and run `npm run db:push`
5. Update relevant server actions and components

## Development Notes

- Database schema is defined in `src/lib/model/`
- Authentication config is in `src/lib/auth.ts`
- Server actions for database operations are in `src/app/actions/`