# 🛡️ SecureForce — Security Workforce Management Platform

A production-grade security workforce management platform built for Australian security companies. Manages employees, rosters/shifts, GPS-verified check-ins, incident reports, and comprehensive audit trails.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | NestJS + TypeScript |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Auth** | JWT + TOTP 2FA |
| **Real-time** | WebSockets (Socket.io) |
| **DevOps** | Docker + GitHub Actions |

## 📁 Project Structure

```
SecureForce/
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/            # JWT + 2FA authentication
│   │   ├── users/           # Employee management
│   │   ├── shifts/          # Roster scheduling
│   │   ├── locations/       # Security site management
│   │   ├── checkins/        # GPS check-in/out + anti-spoofing
│   │   ├── reports/         # Incident reporting
│   │   ├── audit/           # Audit trail logging
│   │   ├── notifications/   # WebSocket real-time updates
│   │   └── entities/        # TypeORM database models
│   └── Dockerfile
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── pages/           # Login, Dashboard, Employees, etc.
│   │   ├── components/      # Sidebar, reusable components
│   │   ├── contexts/        # Auth state management
│   │   ├── api/             # Axios API client
│   │   └── types/           # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml        # Full-stack orchestration
├── .github/workflows/        # CI/CD pipeline
└── README.md
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
# Swagger Docs: http://localhost:3001/api/docs
```

### Option 2: Local Development

#### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Redis 7

#### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit database credentials
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register user | Public |
| `POST` | `/api/auth/login` | Login (+ 2FA) | Public |
| `POST` | `/api/auth/refresh` | Refresh JWT | Public |
| `POST` | `/api/auth/2fa/enable` | Enable 2FA | 🔒 |
| `POST` | `/api/auth/2fa/verify` | Verify 2FA | 🔒 |
| `GET` | `/api/auth/me` | Current user | 🔒 |
| `GET` | `/api/users` | List employees | 🔒 Manager |
| `GET` | `/api/users/:id` | Get employee | 🔒 |
| `PUT` | `/api/users/:id` | Update employee | 🔒 Manager |
| `DELETE` | `/api/users/:id` | Deactivate | 🔒 Admin |
| `POST` | `/api/shifts` | Create shift | 🔒 Manager |
| `GET` | `/api/shifts` | List shifts | 🔒 |
| `GET` | `/api/shifts/my-upcoming` | My upcoming | 🔒 |
| `GET` | `/api/shifts/stats` | Shift stats | 🔒 Manager |
| `POST` | `/api/locations` | Add location | 🔒 Manager |
| `GET` | `/api/locations` | List locations | 🔒 |
| `POST` | `/api/checkins` | GPS check-in/out | 🔒 |
| `GET` | `/api/checkins/flagged` | Flagged check-ins | 🔒 Manager |
| `PUT` | `/api/checkins/:id/verify` | Verify check-in | 🔒 Manager |
| `POST` | `/api/reports` | Submit report | 🔒 |
| `GET` | `/api/reports` | List reports | 🔒 |
| `GET` | `/api/audit` | Audit logs | 🔒 Manager |
| `GET` | `/api/health` | Health check | Public |

Full interactive docs at `/api/docs` (Swagger UI).

## 🗄️ Database Schema

```
┌─────────┐     ┌──────────┐     ┌───────────┐
│  Users   │────▶│  Shifts  │────▶│  CheckIns │
│          │     │          │     │ (GPS data)│
│ roles:   │     │ status:  │     │ verified  │
│ admin    │     │ sched.   │     │ flagged   │
│ manager  │     │ in_prog  │     │ rejected  │
│ employee │     │ complete │     └───────────┘
└─────────┘     └──────────┘
      │               │
      │         ┌──────────┐     ┌───────────┐
      │────────▶│ Reports  │     │ AuditLogs │
      │         │          │     │           │
      └────────▶│ incident │     │ tracks    │
                │ daily    │     │ all CRUD  │
                └──────────┘     └───────────┘
                                      │
                               ┌──────────┐
                               │Locations │
                               │ GPS +    │
                               │ geofence │
                               └──────────┘
```

## 🔒 Security Features

- **JWT + Refresh Tokens** — 15m access / 7d refresh
- **TOTP 2FA** — Google Authenticator compatible
- **GPS Anti-Spoofing** — Haversine distance + geofence + accuracy check
- **Rate Limiting** — 60 req/min per IP
- **Helmet** — Security headers
- **CORS** — Restricted origins
- **Audit Trail** — All actions logged with IP + user agent
- **Input Validation** — class-validator DTOs
- **Password Hashing** — bcrypt with 12 rounds

## 🇦🇺 Australian Compliance

- Security license number tracking
- Australian state selectors (NSW, VIC, QLD, etc.)
- AEST/AEDT timezone display
- Privacy-compliant employee data handling

## 📊 Best 3rd-Party Tools for Australian Security Companies

| Tool | Purpose | Website |
|------|---------|---------|
| **Deputy** | Shift scheduling | deputy.com |
| **TrackTik** | Security workforce mgmt | tracktik.com |
| **Xero** | Payroll (AU compliant) | xero.com |
| **OHS Alert** | WHS compliance | ohsalert.com.au |
| **SLED** | Security license checking | sled.com.au |
| **Twilio** | SMS notifications | twilio.com |
| **SendGrid** | Email notifications | sendgrid.com |
| **Mapbox** | GPS mapping | mapbox.com |

## 🚢 Production Deployment

### AWS Recommended Architecture
- **ECS/Fargate** — Container orchestration
- **RDS** — Managed PostgreSQL
- **ElastiCache** — Managed Redis
- **ALB** — Load balancer
- **CloudFront** — CDN for frontend
- **S3** — File storage (photos, reports)
- **Route 53** — DNS management

### Environment Variables
Copy `.env.example` → `.env` and configure:
- Database credentials
- JWT secrets (use strong random strings in production)
- Redis connection details
- Frontend URL for CORS

## 📄 License

Proprietary — Built for SecureForce Pty Ltd.
