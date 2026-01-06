# Voxterna Backend Setup

The backend is built with **Node.js**, **Express**, **Socket.io**, and **Prisma ORM**.

## Prerequisites
- Node.js (v18+)
- NPM

## Installation

1.  Input `npm install` in the root directory.
2.  Input `npm install -D prisma` if not already installed.

## Database Setup

We use **Prisma** with **SQLite** for development (scalable to Postgres).

1.  Generate the Prisma Client:
    ```bash
    npx prisma generate --schema=./server/prisma/schema.prisma
    ```
    *Note: If you encounter errors on Windows, try deleting `node_modules` and reinstalling.*

2.  Push the database schema (creates `dev.db`):
    ```bash
    npx prisma db push --schema=./server/prisma/schema.prisma
    ```

## Running the Project

1.  **Start Backend**:
    ```bash
    npm run server
    ```
    Runs on `http://localhost:3000`.

2.  **Start Frontend**:
    ```bash
    npm run dev
    ```
    Runs on `http://localhost:5173`.

## Features
- **Authentication**: JWT-based login/register.
- **Real-time Chat**: Socket.io powered (see `server/index.ts` and `src/lib/api.ts`).
- **Interactive Avatar**: Eyes follow cursor, speaks on chat response.
