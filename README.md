# BM-FT (Budget Manager, Finance Tracker)

A backend budgeting system built with Node.js, TypeScript, Fastify, Prisma, and PostgreSQL.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Fastify | HTTP framework |
| Prisma | ORM + migrations |
| Supabase | Database |
| Zod | Runtime validation |
| JWT | Authentication |
| decimal.js | Safe money arithmetic |
| Vitest | Testing |

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env and set own values
```

### 3. Set up the database
```bash
# Make sure PostgreSQL is running, then:
npm run db:migrate     # creates tables & auto-generates Prisma TypeScript types
```

### 4. Start development server
```bash
npm run dev            # starts server with hot-reload at http://localhost:3000
```

### 5. Verify it works
```bash
curl http://localhost:3000/health
#   { "success": true, "data": { "status": "ok", ... } }
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot-reload |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Start compiled production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run lint` | Lint source files |
| `npm run format` | Auto-format source files |

## Project Structure

```
src/
    app.ts         
    server.ts                 
    plugins/                  #Fastify plugins
        auth.ts               #JWT plugin
        cors.ts
        database.ts
        error-handler.ts
        helmet.ts
        logger.ts
        
    modules/                  #Feature modules
        auth/
        accounts/
        transactions/
        categories/
        budgets/
    shared/
        errors/AppError.ts    #Custom error classes
        middleware/           #Auth guards, etc.
        schemas/              #Shared Zod schemas
    lib/
        prisma.ts             #Prisma singleton
        utilities.ts          #Safe money arithmetic utilities
    types/
        index.ts              #Global TypeScript types
        fastify.d.ts          #Fastify declarations

prisma/
    schema.prisma             #Database schema
    migrations/               #Auto-generated migration files
```
