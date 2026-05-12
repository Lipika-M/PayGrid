# Distributed Wallet & Payment System ⚖️

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-6-red)](https://redis.io/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.x-yellowgreen)](https://docs.bullmq.io/)
[![License](https://img.shields.io/badge/License-ISC-orange)](LICENSE)

> A concise, production-minded wallet and payment backend built with Node.js, Express, PostgreSQL, Redis, and BullMQ. The project focuses on distributed systems basics, async job processing, fault tolerance, and financial ledger architecture.

## Why This Project?

This project was built to model the core backend challenges behind payment systems: atomic updates, auditable balance changes, and safe retries. It is intentionally shaped as a strong student backend project rather than an exaggerated enterprise system.

## System Architecture

Mermaid:

```mermaid
flowchart LR
  Client[Client] --> API[Express API]
  API --> DB[(PostgreSQL / Supabase)]
  API --> Redis[(Redis)]
  API --> Queue[BullMQ Queue]
  Queue --> Worker[Worker Process]
  Worker --> DB
  DB --> Wallets[Wallets]
  DB --> Tx[Transactions]
  DB --> Ledger[Ledger Entries]
```

ASCII:

```text
[Client] -> [Express API] -> [PostgreSQL]
                   |              ^
                   v              |
                [Redis/BullMQ] -> [Worker]
                                     |
                                     v
                              [Wallets / Ledger / Transactions]
```

## Tech Stack

- Node.js + Express 5
- PostgreSQL via `pg` and Supabase-compatible `DATABASE_URL`
- Redis + BullMQ for async processing
- JWT auth, bcrypt, helmet, morgan, cors, cookie-parser, dotenv

## Core Features

- User registration and login
- Wallet creation and wallet lookup
- Credit, debit, and wallet-to-wallet transfer
- Ledger entries for every balance mutation
- Transaction history and transaction status tracking
- Async job processing with retries and backoff
- Optimistic concurrency control on wallet balance updates
- Idempotency keys for duplicate-request protection

## Engineering Challenges Solved

- **Transaction rollback consistency**: critical wallet, ledger, and transaction status writes run inside `withTransaction(client)` so they commit or roll back together.
- **Ledger integrity**: every successful balance change creates a matching ledger entry, which keeps the balance history auditable.
- **Optimistic concurrency control**: `wallets.version` prevents lost updates when multiple requests target the same wallet at once.
- **Idempotency**: `idempotency_key` prevents duplicate financial actions when clients retry the same request.
- **BullMQ worker safety**: jobs are processed in a background worker with queue retries, and transaction state transitions keep jobs idempotent from the worker side.
- **Retry handling for concurrent updates**: conflict-heavy paths use retry logic so transient version conflicts do not corrupt balances.

## Design Decisions

- **BullMQ** is used to decouple API requests from payment execution, which keeps the API responsive and allows safe background processing.
- **Optimistic locking** is a practical fit for wallet balances because it handles concurrency without long-lived locks.
- **Ledger entries** exist to preserve a financial audit trail rather than relying only on the current balance.
- **Idempotency keys** matter because payment APIs must tolerate retries without duplicating money movement.

## Failure Handling

- If any balance update, ledger insert, or status change fails inside a transaction, the database rolls back the entire unit of work.
- The worker marks failed jobs clearly and BullMQ can retry according to its queue settings.
- This gives the system fault tolerance without pretending that failures do not happen.

## Architecture Overview

The API creates transactions and pushes jobs into BullMQ. The worker then resolves the wallets, applies the balance change, writes ledger entries, and updates transaction status. The database remains the source of truth for wallet state and history.

## Folder Structure

```text
backend/src/
  app.js            # Express app and routes
  server.js         # Server bootstrap
  config/           # DB, Redis, env
  constants/        # transaction and ledger enums
  controllers/      # HTTP handlers
  db/               # withTransaction helper
  middlewares/      # JWT auth
  models/           # DB access layer
  queue/            # BullMQ queue setup
  routers/          # API routes
  services/         # business logic
  utils/            # response, error, async helpers
  workers/          # payment worker
```

## API Endpoints

Base path: `/api/v1`

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/users/register` | No | Register a user |
| POST | `/users/login` | No | Login and receive JWT |
| GET | `/users/:id` | Yes | Get user by ID |
| POST | `/wallets` | Yes | Create wallet |
| GET | `/wallets/me` | Yes | Get current wallet |
| GET | `/ledger/balance` | Yes | Get current balance |
| GET | `/ledger/history` | Yes | Get ledger entries |
| POST | `/transactions/debit` | Yes | Queue debit |
| POST | `/transactions/credit` | Yes | Queue credit |
| POST | `/transactions/transfer` | Yes | Queue transfer |
| GET | `/transactions/:id` | Yes | Get transaction status |

### Example request

```http
POST /api/v1/transactions/transfer
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "receiverEmail": "bob@example.com",
  "amount": 200,
  "description": "Rent split",
  "idempotencyKey": "transfer-2026-05-12-001"
}
```

### Example response

```json
{
  "statusCode": 202,
  "data": {
    "id": 102,
    "status": "PENDING"
  },
  "message": "Transfer Transaction queued",
  "success": true
}
```

## Queue + Worker Flow

1. API receives a request and creates a `PENDING` transaction.
2. The transaction is pushed to the `payment-processing` BullMQ queue.
3. The worker marks the transaction `PROCESSING`.
4. Inside one DB transaction, the worker updates wallet(s), inserts ledger entries, and marks the transaction `SUCCESS`.
5. If anything fails, the worker marks the transaction `FAILED` and BullMQ can retry the job.

## Wallet Transfer Flow

- Sender and receiver wallets are fetched first.
- The sender balance is decreased and the receiver balance is increased.
- Both updates use the same `client` inside the transaction boundary.
- Ledger entries are written for both sides so the transfer remains auditable.

## Database Schema Overview

- `users`: `id`, `email`, `password_hash`, `created_at`
- `wallets`: `id`, `user_id`, `balance`, `version`, timestamps
- `transactions`: `id`, `wallet_id`, `receiver_wallet_id`, `transaction_type`, `amount`, `status`, `idempotency_key`, `description`, timestamps
- `ledger_entries`: `id`, `wallet_id`, `transaction_id`, `entry_type`, `amount`, `balance_after`, `description`, `created_at`

## Optimistic Locking

The wallet update path uses a version check:

```sql
UPDATE wallets
SET balance = $1, version = version + 1
WHERE id = $2 AND version = $3
RETURNING *;
```

If no row is returned, another request updated the wallet first and the operation should be retried or rejected as a conflict.

## Setup

```bash
cd backend
npm install
```

Example environment variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@host:5432/database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

## Run

```bash
cd backend
npm run dev
```

Run the worker in a second terminal:

```bash
cd backend
npm run worker
```

## Production Notes

- Stateless API servers can be scaled horizontally.
- Worker concurrency can be increased independently of the API.
- Managed PostgreSQL and Redis are the right fit for deployment.
- This design naturally supports eventual consistency between request acceptance and background execution.

## Example Test Scenarios

- Register a user, create a wallet, and credit it.
- Submit a debit with the same idempotency key twice and verify no duplicate side effect.
- Transfer between two wallets and confirm two ledger rows are written.
- Trigger concurrent updates to the same wallet and verify one update conflicts cleanly.

## Key Learnings

- Payment systems need auditability, not just current state.
- Async job processing keeps the API responsive while background workers handle slower mutations.
- Correct transaction boundaries matter more than raw CRUD speed.

## License

ISC
