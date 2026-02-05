# Email Scheduler Project

A web-based email scheduling application built with **Express.js backend**, **React/Next.js frontend**, and **BullMQ for job queueing**. This project allows users to schedule emails, view dashboard stats, and ensures persistence, rate limiting, and concurrency control.

# Email Scheduler Setup Guide

Complete step-by-step setup for backend and frontend.

## Overview

This project has **two separate services**:

- **Backend** (`/backend`) - Express.js API on port 3001
- **Frontend** (`/frontend`) - Next.js React on port 3000
- **Infrastructure** - PostgreSQL + Redis (Docker)

Both need to run for the system to work.

## Prerequisites

- Node.js 
- npm 
- Docker & Docker desktop
- Ethereal Email account

## Step 1: Infrastructure 

Start PostgreSQL and Redis:

bash

docker-compose up -d
docker ps

You should see two containers:
- `email_scheduler_db` - PostgreSQL on 5432
- `email_scheduler_redis` - Redis on 6379

## Step 2: Backend Setup

Setup the Express API:

bash
cd backend

npm install

# Create .env file
.env

**Edit `.env` file:**

Open `backend/.env` and update these values:

env
# Get free credentials from https://ethereal.email/
SMTP_USER=your-email@ethereal.email
SMTP_PASSWORD=your-password

DATABASE_URL=postgresql://scheduler_user:scheduler_password@localhost:5432/email_scheduler
REDIS_URL=redis://localhost:6379
PORT=3001

**Setup database:**

bash
npm run prisma:migrate

npm run dev

Wait for output:
[SERVER] Server running on http://localhost:3001

**Backend is now running!** Keep this terminal open.

## Step 3: Frontend Setup

In a **new terminal**, setup the dashboard:

bash
cd frontend
npm install

# Create .env.local
.env.local

# Start frontend
npm run dev

Wait for output:

**Frontend is now running!** Open http://localhost:3000 in browser.

## Step 4: Verify Everything Works

1. **Open frontend**: http://localhost:3000
2. **Backend API**: http://localhost:3001
3. **Login page** should load
4. **Click "Compose Email"** to test the API connection
5. **Backend logs** should show API requests

## Running Both Services

You need **3 terminal windows**:

# Terminal 1: Infrastructure
docker-compose up -d

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend  
cd frontend && npm run dev

All three must be running for the system to work.

## Verify Services

### Check Backend is Running
### Check Frontend is Running
### Check PostgreSQL Connection
### Check Redis Connection



## Visual Guide to Email Scheduler

Complete visual diagrams showing how the system works.

## System Architecture
### High-Level Overview

┌─────────────────────────────────────────────────────────┐
│               USER (Browser)                            │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   FRONTEND (Port 3000)    │
        │   ▪ Login Page            │
        │   ▪ Dashboard             │
        │   ▪ Compose Modal         │
        └─────────────┬─────────────┘
                      │
                 HTTP API
                      │
        ┌─────────────▼─────────────┐
        │   BACKEND (Port 3001)     │
        │   ▪ Routes                │
        │   ▪ Middleware            │
        │   ▪ Business Logic        │
        │   ▪ Worker                │
        └──┬─────┬─────┬────────────┘
           │     │     │
    ┌──────▼─┐  ┌▼─────▼──┐   ┌──────────┐
    │PostgreSQL  │ Redis   │   │ Ethereal │
    │ Database   │ Queue   │   │ SMTP     │
    └───────────┘ └────────┘   └──────────┘


## Acknowledgments

- Inspired by ReachInbox email scheduler architecture
- Built with Express.js, BullMQ, PostgreSQL, Next.js
- Uses modern TypeScript for type safety
- Designed for production use

**Ready to schedule emails at scale!** Start with the Quick Start section above.





Thank you for reviewing my project!

